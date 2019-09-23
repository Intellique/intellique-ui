(function(window, $) {
"use strict";

var config = null;

var $document = $(window.document);

var currentLanguage = null;
var currentLanguageDict = null;

$.ajax({
	type: 'GET',
	url: 'config.json',
	success: function(newConfig) {
		config = newConfig;

		var languagesAvailables = ['en', 'es', 'fr', 'ta'];
		var browserLanguages = window.navigator.languages;
		for (var i = 0, n = browserLanguages.length; i < n; i++)
			if (languagesAvailables.indexOf(browserLanguages[i]) != -1) {
				currentLanguage = browserLanguages[i];
				break;
			}

		if (currentLanguage === null)
			currentLanguage = 'en';

		$.ajax({
			type: 'GET',
			url: config["simple-ui url"] + '/lang/' + currentLanguage + '.json',
			success: function(newLang) {
				currentLanguageDict = newLang;

				// check token
				var params = decodeURI(location.search.substr(1)).split('&');
				var token = null;
				for (var i = 0, n = params.length; i < n; i++) {
					var param = params[i].split('=');
					if (param.length < 2)
						continue;

					if (param[0] == 'token') {
						token = param[1];
						break;
					}
				}

				function refresh() {
					location.href = location.pathname;
				}

				authService.checkAuth(function() {
					$(":mobile-pagecontainer").pagecontainer("change", "#archivePage");
					if (token)
						refresh();
					else
						main();
				}, function() {
					$(":mobile-pagecontainer").pagecontainer("change", "#authentication_page");

					if (token) {
						authService.doAuthWithToken(param[1], refresh, refresh);
					} else
						main();
				});
			}
		});
	}
});


function AuthService() {
	var currentUserInfo = null;
	var authTimer = null;

	var adminMenuItem = null;

	function connected(onSuccess) {
		onSuccess = onSuccess || $.noop;

		return function(response) {
			if (!currentUserInfo) {
				if (adminMenuItem == null)
					adminMenuItem = $('#adminPage');

				getUserInfo(response.user_id, function(response) {
					currentUserInfo = response.user;
					authTimer = window.setInterval(checkAuth, 20000);

					if (currentUserInfo.isadmin)
						adminMenuItem.show();
					else
						adminMenuItem.hide();

					onSuccess(currentUserInfo);
				});
			} else
				onSuccess(currentUserInfo);
		}
	}

	var dialog = null;
	$document.one('pagechange', function() { dialog = $('#sessionTimeout'); });

	function notConnected(onError) {
		onError = onError || $.noop;

		return function(response) {
			if (currentUserInfo) {
				currentUserInfo = null;

				window.clearInterval(authTimer);
				authTimer = null;

				translate(dialog);
				$.mobile.changePage("#sessionTimeout", {changeHash: false, reverse: false});

				// jquery mobile hack
				$document.one('pagechange', function() {
					var close = dialog.find('a[role="button"]');
					close.attr('href', '#authentication_page');
				});
			}

			onError();
		}
	}

	function checkAuth(onSuccess, onError) {
		$.ajax({
			type: "GET",
			dataType: "json",
			url: config["api url"] + "/api/v1/auth/",
			success: connected(onSuccess),
			error: notConnected(onError)
		});
	}
	this.checkAuth = checkAuth;

	this.doAuth = function(login, password, onSuccess, onError) {
		var authData = {
			login: login,
			password: password,
			apikey: config["apikey"]
		};

		$.ajax({
			type: "POST",
			url: config["api url"] + "/api/v1/auth/",
			data: JSON.stringify(authData),
			dataType: "json",
			contentType: "application/json",
			success: connected(onSuccess),
			error: notConnected(onError)
		});
	}

	this.doAuthWithToken = function(token, onSuccess, onError) {
		var authData = {
			apikey: config["apikey"]
		};

		$.ajax({
			type: "POST",
			url: config["api url"] + "/api/v1/auth/",
			headers: {
				'Authorization': token
			},
			data: JSON.stringify(authData),
			dataType: "json",
			contentType: "application/json",
			success: onSuccess,
			error: onError
		});
	}

	this.doLogOut = function() {
		$.ajax({
			type: "DELETE",
			url: config["api url"] + "/api/v1/auth/",
			success: function() {
				currentUserInfo = null;

				window.clearInterval(authTimer);
				authTimer = null;

				$(":mobile-pagecontainer").pagecontainer("change", "#authentication_page");
			}
		});
	}

	this.getUserInfo = function() {
		return currentUserInfo;
	}
}
var authService = new AuthService();


function convertSize(size) {
	if (typeof size == "string")
		size = parseInt(size);

	var mult = 0;
	var type;

	while (size >= 1024) {
		mult++;
		size /= 1024;
	}

	var width = 0;

	if (size < 10)
		width = 2;
	else if (size < 100)
		width = 1;

	switch (mult) {
		case 0:
			type = translateGetKey("size.short.B");
			break;
		case 1:
			type = translateGetKey("size.short.KB");
			break;
		case 2:
			type = translateGetKey("size.short.MB");
			break;
		case 3:
			type = translateGetKey("size.short.GB");
			break;
		case 4:
			type = translateGetKey("size.short.TB");
			break;
		default:
			type = translateGetKey("size.short.PB");
			break;
	}

	return type.replace(/\{(\w+)\}/g, function(match, expr) {
		return size.toLocaleString(currentLanguage, {maximumFractionDigits: width})
	});
}


function getUserInfo(id, callback) {
	$.ajax({
		type: 'GET',
		url: config["api url"] + "/api/v1/user/?id=" + id,
		success: callback
	});
}


function getPoolGroupById(id, onSuccess) {
	$.ajax({
		type: 'GET',
		url: config["api url"] + "/api/v1/poolgroup/?id=" + id,
		success: function(response) {
			onSuccess(response.poolgroup);
		}
	});
}


function GalleryViewCtl(gallery, model, factory) {
	function display() {
		if (!gallery.is(':empty'))
			return;

		var results = model.getResult();
		for (var i = 0, n = results.length; i < n; i++) {
			var link = $('<a class="ui-btn ui-btn-icon-right ui-icon-carat-r"></a>');
			if (factory.action)
				link.on(factory.action, results[i]);

			link.append(factory.widget(results[i]));

			var header = $('<h2></h2>');
			header.text(factory.header(results[i]));
			link.append(header);

			var label = $('<p></p>');
			label.text(factory.label(results[i]));
			link.append(label);

			if (factory.has_icon(results[i]))
				link.append(factory.icon(results[i]));

			var item = $('<li class="ui-li-has-thumb"></li>');
			item.append(link);
			gallery.append(item);
		}

		gallery.enhanceWithin();
	}

	model.addObserver({
		prefetch: function() {
			gallery.delay(200).animate({opacity: '0.5'});
			$.mobile.loading("show");
		},
		fetch: function() {
			gallery.stop(true, false).animate({opacity: '1'}, 500);
			gallery.empty();

			$.mobile.loading("hide");

			if (gallery.is(':hidden'))
				return;

			display();
		}
	});

	this.refresh = display;
}


function ListViewCtl(list, model, factory) {
	function display() {
		if (!list.is(':empty'))
			return;

		var results = model.getResult();
		for (var i = 0, n = results.length; i < n; i++) {
			var item = $('<div data-role="collapsible"></div>');

			var title = $('<h2 class="ui-collapsible-heading"></h2>');
			var a = $('<a class="ui-collapsible-heading-toggle ui-btn ui-btn-icon-left ui-btn-a ui-icon-plus"><div class="icon"></div>' + factory.title(results[i]) + '</a>');

			if (factory.icon) {
				var url = factory.icon(results[i]);
				$.ajax({
					cache: true,
					context: {
						'parent': a,
						'url': url,
					},
					type: "HEAD",
					url: url,
					success: function() {
						var url = this.url;
						var icon = this.parent.find('div.icon');
						var img = $('<img src="' + url + '" />');
						icon.append(img);
					}
				});
			}

			title.on('click', {'item': item, 'link': a, 'object': results[i], 'template': null}, function(evt) {
				var ctx = evt.data;

				ctx.link.toggleClass('ui-icon-plus ui-icon-minus');

				if (ctx.template) {
					ctx.template.stop(true, false).slideToggle(500);
					return;
				}

				$.mobile.loading( "show");
				$.ajax({
					'url': factory.template,
					success: function(template) {
						ctx.template = $(template);
						factory.fillTemplate(ctx.template, ctx.object);
						ctx.template.hide();
						ctx.item.append(ctx.template.enhanceWithin());
						ctx.template.slideToggle(500);
						$.mobile.loading("hide");
					},
					error: function() {
						$.mobile.loading("hide");
						ctx.link.toggleClass('ui-icon-plus ui-icon-minus');
					}
				});
			});

			title.append(a);
			item.append(title);

			list.append(item);

			if (n == 1)
				title.trigger('click');
		}
	}

	model.addObserver({
		prefetch: function() {
			list.delay(200).animate({opacity: '0.5'});
			$.mobile.loading("show");
		},
		fetch: function() {
			list.stop(true, false).animate({opacity: '1'}, 500);
			list.empty();

			$.mobile.loading("hide");

			if (list.is(':hidden'))
				return;

			display();
		}
	});

	this.refresh = display;
}


function Model(observers) {
	var limit = 10, offset = 0, rounded = false;

	this.addObserver = function(observer) {
		if (observers.indexOf(observer) < 0)
			observers.push(observer);
		if (observers.length == 1)
			this.fetch();
	}

	this.fetch = $.noop;

	this.getLimit = function() {
		return limit;
	}

	this.getOffset = function() {
		return offset;
	}

	this.isTotalRowRounded = function() {
		return rounded;
	}

	this.removeObserver = function(observer) {
		var index = observers.indexOf(o);
		if (index > -1)
			observers.splice(o, 1)
	}

	this.search = $.noop;

	this.setLimit = function(newLimit) {
		var checkedNewLimit = parseInt(newLimit);
		if (checkedNewLimit != newLimit)
			return;

		if (checkedNewLimit > 0 && limit != checkedNewLimit) {
			limit = checkedNewLimit;
			offset -= offset % limit;
			this.update();
		}
	}

	this.setOffset = function(newOffset) {
		var checkedNewOffset = parseInt(newOffset);
		if (newOffset != checkedNewOffset)
			return;

		checkedNewOffset -= checkedNewOffset % limit;
		if (checkedNewOffset >= 0 && offset != checkedNewOffset) {
			offset = checkedNewOffset;
			this.update();
		}
	}

	this.setTotalRowRounded = function(is_rounded) {
		rounded = is_rounded;
	}

	this.update = function() {
		if (observers.length > 0)
			this.fetch();
	}
}


function ModelAjax(url, keyIndex, keySearch) {
	var ids = [];
	var totalRows = 0;
	var cacheKey = {};
	var cacheWeak = new WeakMap();
	var observers = [];

	Model.call(this, observers);

	var searchParameters = {};

	function discardItemById(id) {
		if (!(id in cacheKey))
			return;

		var key = cacheKey[id];
		if (cacheWeak.has(key))
			cacheWeak.delete(key);
	}
	this.discardItemById = discardItemById;

	this.fetch = function() {
		for (var obs in observers)
			if (observers[obs].prefetch)
				observers[obs].prefetch();

		function completed() {
			for (var obs in observers)
				if (observers[obs].fetch)
					observers[obs].fetch();
		}

		var searchParams = $.extend(true, {}, searchParameters);
		var limit = this.getLimit(), offset = this.getOffset();
		if (limit)
			searchParams['limit'] = limit;
		if (offset)
			searchParams['offset'] = offset;

		$.ajax({
			type: "GET",
			context: this,
			url: config["api url"] + url + 'search/',
			data: searchParams,
			success: function(response) {
				ids = response[keySearch];
				totalRows = response.total_rows;
				this.setTotalRowRounded(response.rounded || false);

				var got = 0;
				for (var i = 0, n = ids.length; i < n; i++) {
					this.getItemById(ids[i], function() {
						got++;
						if (got == n)
							completed();
					}, function() {
						ids = [];
						totalRows = 0;
						completed();
					});
				}

				if (ids.length == 0)
					this.setOffset(0);
			},
			error: function() {
				ids = [];
				totalRows = 0;
				completed();
			}
		});
	}

	this.getItemById = function(id, forceSync, onSuccess, onError) {
		if (typeof forceSync == "function") {
			onError = onSuccess;
			onSuccess = forceSync;
			forceSync = false;
		}
		onError = onError || $.noop;

		if (!(id in cacheKey))
			cacheKey[id] = new Number(id);
		var key = cacheKey[id];

		if (cacheWeak.has(key)) {
			onSuccess(cacheWeak.get(key));
			return;
		}

		$.ajax({
			async: !forceSync,
			type: 'GET',
			context: this,
			url: config["api url"] + url + '?id=' + id,
			success: function(response) {
				var obj = response[keyIndex];
				cacheWeak.set(cacheKey[obj.id], obj);

				window.setTimeout(function(id) {
					discardItemById(id);
				}, 60000, id);

				onSuccess(obj);
			},
			error: onError
		});
	}

	this.getResult = function() {
		var results = [];
		for (var i = 0, n = ids.length; i < n; i++) {
			var key = cacheKey[ids[i]];
			results.push(cacheWeak.get(key));
		}
		return results;
	}

	this.getTotalRows = function() {
		return totalRows;
	}

	this.search = function(searchParams) {
		searchParameters = searchParams;
		this.fetch();
	}
}


function ModelMetadata(metadata) {
	var observers = [];
	Model.call(this, observers);

	var keys = Object.keys(metadata);
	keys.sort();

	var meta = [];
	for (var i = 0, n = keys.length; i < n; i++)
		meta.push({key: keys[i], value: metadata[keys[i]]});

	this.fetch = function() {
		for (var obs in observers)
			if (observers[obs].fetch)
				observers[obs].fetch();
	}

	this.getResult = function() {
		return meta;
	}

	this.getTotalRows = function() {
		return keys.length;
	}
}


function ModelVolume(volumes) {
	var observers = [];
	Model.call(this, observers);

	this.fetch = function() {
		for (var obs in observers)
			if (observers[obs].fetch)
				observers[obs].fetch();
	}

	this.getResult = function() {
		return volumes;
	}

	this.getTotalRows = function() {
		return volumes.length;
	}
}


function PaginationCtl(page, model) {
	var nbElts = page.find('.infoLines .totalRows .nbElts');
	var pageN = page.find('.infoLines .pageN');
	var selectLimit = page.find('.pagination select.menuLimit');
	var paginationBttns = page.find('.paginationButton');

	function go(index) {
		return function() {
			model.setOffset(index);
		}
	}

	selectLimit.on('change', function(evt) {
		model.setLimit(selectLimit.val());
	});
	model.setLimit(selectLimit.val());

	model.addObserver({
		prefetch: function() {
			nbElts.delay(1000).animate({opacity: '0.5'}, 500);
			pageN.delay(1000).animate({opacity: '0.5'}, 500);
			selectLimit.val(model.getLimit());
			paginationBttns.delay(1000).animate({opacity: '0.5'}, 500);
		},
		fetch: function() {
			var limit = model.getLimit(), offset = model.getOffset();
			var totalRows = model.getTotalRows();
			var firstLine = totalRows > 0 ? offset + 1 : 0;
			var lastLine = offset + limit > totalRows ? totalRows : offset + limit;

			translatePluralByElt(nbElts, totalRows, {'nb': totalRows}, model.isTotalRowRounded());
			translatePluralByElt(pageN, lastLine, {'offset': firstLine, 'end': lastLine});
			nbElts.stop(true, false).animate({opacity: '1'}, 500);
			pageN.stop(true, false).animate({opacity: '1'}, 500);

			paginationBttns.stop(true, false).animate({opacity: '1'}, 500);
			var children = paginationBttns.find("a");

			if (children.length > 4) {
				children.slice(2, -2).remove();
				children = paginationBttns.find("a");
			}

			var currentPage = offset / limit, pageCount = totalRows / limit;

			if (offset == 0) {
				children.eq(0).addClass('disabled').off();
				children.eq(1).addClass('disabled').off();
			} else {
				children.eq(0).removeClass('disabled').off().on('click', go(0));
				children.eq(1).removeClass('disabled').off().on('click', go(offset - limit));
			}

			if (offset + limit >= totalRows) {
				children.eq(-1).addClass('disabled').off();
				children.eq(-2).addClass('disabled').off();
			} else {
				children.eq(-2).removeClass('disabled').off().on('click', go(offset + limit));
				if (totalRows % limit == 0)
					children.eq(-1).removeClass('disabled').off().on('click', go(totalRows - limit));
				else
					children.eq(-1).removeClass('disabled').off().on('click', go(totalRows - totalRows % limit));
			}

			for (var i = currentPage - 3; i < currentPage + 4 && i < pageCount; i++) {
				if (i < 0)
					continue;

				var pageNumber = $('<a class="ui-btn ui-corner-all"></a>');
				pageNumber.text(i + 1);

				if (offset == i * limit)
					pageNumber.addClass('disabled');
				else
					pageNumber.on('click', go(i * limit));

				pageNumber.insertBefore(children.eq(-2));
			}

			// jQuery Mobile hack
			var unwanted = paginationBttns.find('.ui-controlgroup-controls');
			if (unwanted) {
				var children2 = unwanted.children();
				children2.detach();
				unwanted.replaceWith(children2);
			}
		}
	});
}


function SearchCtl(page, model, searchFunc) {
	var input = page.find('input.search');
	var clearBttn = null;
	searchFunc = searchFunc || function(search) { return search };

	function deferred(event, ui) {
		if (page.is(ui.toPage) && clearBttn == null) {
			clearBttn = page.find('a.ui-input-clear');
			clearBttn.on('click', function() {
				model.search(searchFunc(''));
			});
		} else
			$document.one("pagechange", deferred);
	}
	$document.one("pagechange", deferred);

	this.search = function(lookingFor) {
		input.val(lookingFor);
		model.search(searchFunc(lookingFor));
	}

	var delaySearch = null;
	function searchDelayed() {
		if (delaySearch)
			window.clearTimeout(delaySearch);
		delaySearch = window.setTimeout(searchNow, 1000);
	}

	function searchNow() {
		if (delaySearch)
			window.clearTimeout(delaySearch);
		delaySearch = null;

		model.search(searchFunc(input.val()));
	}

	input.on('keyup', function(evt) {
		if (evt.which == 13)
			searchNow();
		else
			searchDelayed();
	});
}


function TableView(table, model, factory) {
	var head = table.find('thead tr');
	var body = table.find('tbody');

	for (var i = 0, n = factory.length; i < n; i++) {
		var th = $('<th />').attr('x-lang-key', factory[i].translate);

		var translation = translateGetKeyByElt(th);
		if (translation)
			translateElement(th, translation);
		else
			th.text(factory[i].name);

		// TODO: add function to sort header
		head.append(th);
	}

	model.addObserver({
		prefetch: function() {
			table.delay(1000).animate({opacity: '0.5'});
		},
		fetch: function() {
			table.stop(true, false).animate({opacity: '1'}, 500);
			body.empty();

			var results = model.getResult();
			for (var i = 0, n = results.length; i < n; i++) {
				var row = $('<tr />');

				for (var j = 0, m = factory.length; j < m; j++) {
					var td = $('<td/>');
					factory[j].fillCell(td, factory[j].name, results[i]);
					row.append(td);
				}
				body.append(row);
			}
		}
	});
}


function translate(elt) {
	if (currentLanguageDict === null)
		return;

	elt.find('[x-lang-key]').addBack('[x-lang-key]').each(function(index, element) {
		var $element = $(element);
		var translation = translateGetKeyByElt($element);
		if (translation)
			translateElement($element, translation);
	});
}


function translateDateTime(dt) {
	var date = new Date(Date.parse(dt.date + dt.timezone));
	return date.toLocaleString(currentLanguage);
}


function translateElement(elt, translation) {
	elt.attr('lang', currentLanguage);
	if (elt.attr('type') == 'button')
		elt.attr('value', translation);
	else if (elt.attr('placeholder') !== undefined)
		elt.attr('placeholder', translation);
	else if (elt.attr('label') !== undefined)
		elt.attr('label', translation);
	else if (elt.attr('title') !== undefined)
		elt.attr('title', translation);
	else if (elt.attr('type') == 'submit') {
		// hack in order to translate button
		elt.before(translation);
	} else
		elt.html(translation);
}


function translateGetKey(key) {
	var parts = key.split('.');
	var dict = currentLanguageDict;
	for (var i = 0, n = parts.length; i < n; i++) {
		dict = dict[parts[i]];
		if (!dict)
			return null;
	}
	return dict;
}


function translateGetKeyByElt(elt) {
	var key = elt.attr('x-lang-key');
	if (key)
		return translateGetKey(key);
	else
		return null;
}


function translatePage(page) {
	function deferred() {
		if (page.is('.ui-page'))
			translate(page);
		else
			$document.one('pagechange', deferred);
	}
	deferred();
}


function translatePlural(key, nb, values, rounded) {
	if (!translatePluralInit())
		return;

	var translations = translateGetKey(key);
	if (!translations)
		return;

	return translatePluralInner(translations, nb, values, rounded);
}


var pluralsEvals = [];
function translatePluralInit() {
	if (currentLanguageDict === null)
		return false;

	if (pluralsEvals.length == 0) {
		var exps = currentLanguageDict[""]["plurals form"];
		for (var i = 0, n = exps.length; i < n; i++)
			pluralsEvals.push(new Function('n', "return " + exps[i]));
	}

	return true;
}


function translatePluralInner(translations, nb, values, rounded) {
	rounded = (!!rounded) || false;

	var form = 0;
	for (var nbForms = pluralsEvals.length; form < nbForms; form++)
		if (pluralsEvals[form](nb))
			break;

	values = values || {};
	return translations[form].replace(/\{(\w+)\}/g, function(match, expr) {
		switch (typeof values[expr]) {
			case "number":
				return (rounded ? '~ ' : '') + values[expr].toLocaleString(currentLanguage);

			default:
				return values[expr];
		}
	});
}


function translatePluralByElt(elt, nb, values, rounded) {
	if (!translatePluralInit())
		return;

	var translations = translateGetKeyByElt(elt);
	if (!translations)
		return;

	var translation = translatePluralInner(translations, nb, values, rounded);
	translateElement(elt, translation);
}


function main() {
	function PageAuth() {
		var page = $('#authentication_page');
		translatePage(page);

		var loginInput = page.find('#identifiant');
		var passwordInput = page.find('#password');
		var submitWrapper = null;

		function deferred() {
			submitWrapper = page.find('div.ui-btn').has('#log_in_button');
			if (submitWrapper.length == 0) {
				$document.one("pagechange", deferred);
				return;
			}

			loginInput.on('keyup', submitEnabled);
			loginInput.next().on('click', submitEnabled);
			passwordInput.on('keyup', submitEnabled);
			passwordInput.next().on('click', submitEnabled);
			submitEnabled();
		}
		deferred();

		function submitEnabled() {
			var login = loginInput.val();
			var password = passwordInput.val();

			if (login.length == 0 || password.length < 6)
				submitWrapper.addClass('ui-state-disabled');
			else
				submitWrapper.removeClass('ui-state-disabled');
		}

		page.find('form').on('submit', function(evt) {
			var login = loginInput.val();
			var password = passwordInput.val();

			if (login.length == 0 || password.length < 6)
				return false;

			$.mobile.loading( "show");

			authService.doAuth(login, password, function(reponse) {
				// change to archive page
				$(":mobile-pagecontainer").pagecontainer("change", "#archivePage");
				$.mobile.loading("hide");
				passwordInput.val('').textinput('refresh');
			}, function() {
				// popup invalid password or login
				translate($('#authFailure'))
				$.mobile.changePage("#authFailure");
				$.mobile.loading("hide");
			});

			return false;
		});
	}


	function PageArchive() {
		var page = $('#archivePage');
		translatePage(page);

		function preSearch(input) {
			var search = {};
			var match, regex = /(?:(archivefile|creator|media|owner|pool|poolgroup|uuid):\s*)?(?:"([^"\\]*(?:\\.[^"\\]*)*)"|([^'"\n\s]+)|'([^'\\]*(?:\\.[^'\\]*)*)')/g;

			var lems = [];
			while ((match = regex.exec(input)) != null) {
				var matched = match[2] || match[3] || match[4] || match[5] || match[6] || match[7];
				if (match[1])
					search[match[1]] = matched;
				else
					lems.push(matched);
			}

			if (lems.length > 1)
				search.name = '(?:.*(' + lems.join('|') + ')){' + lems.length + '}';
			else if (lems.length == 1)
				search.name = lems[0];

			return search;
		}

		var model = new ModelAjax("/api/v1/archive/", 'archive', 'archives');
		var listViewCtl = new ListViewCtl(page.find('#archiveList'), model, {
			title: function(archive) {
				return archive.name;
			},
			template: 'template/archive.html',
			fillTemplate: function(template, archive) {
				translate(template);

				template.find('span[data-name="uuid"]').text(archive.uuid);
				if (archive.volumes.length > 0) {
					template.find('span[data-name="starttime"]').text(translateDateTime(archive.volumes[0].starttime));
					template.find('span[data-name="endtime"]').text(translateDateTime(archive.volumes[archive.volumes.length - 1].endtime));
					template.find('span[data-name="size"]').text(convertSize(archive.size) + " (" + translatePlural("size.long", archive.size, {size: archive.size}) + ")");
				} else
					template.find('span[data-name="size"]').text(convertSize(0) + " (" + translatePlural("size.long", 0, {size: 0}) + ")");
				template.find('span[data-name="owner"]').text(archive.owner);
				template.find('span[data-name="creator"]').text(archive.creator);
				template.find('span[data-name="canappend"]').text(archive.canappend);
				template.find('span[data-name="lastversion"]').text(archive.currentver);

				getUserInfo(archive.owner, function(response) {
					template.find('span[data-name="owner"]').text(response.user.login);
				});
				getUserInfo(archive.creator, function(response) {
					template.find('span[data-name="creator"]').text(response.user.login);
				});

				var tableMetadata = template.find('table.metadata');
				if (archive.metadata) {
					var modelMetadata = new ModelMetadata(archive.metadata);
					var table = new TableView(tableMetadata, modelMetadata, [{
						name: 'key',
						fillCell: function(cell, key, metadata) {
							cell.text(metadata.key);
						}
					}, {
						name: 'value',
						fillCell: function(cell, key, metadata) {
							cell.text(metadata.value);
						}
					}]);
				} else {
					var span = $('<span x-lang-key="archive.template.no_metadata"></span>');
					translate(span);
					tableMetadata.replaceWith(span);
				}

				var modelVolumes = new ModelVolume(archive.volumes);
				var table = new TableView(template.find('table.volume'), modelVolumes, [{
					'name': 'sequence',
					'sortable': 'false',
					'fillCell': function(cell, key, volume) {
						cell.text(volume.sequence);
					},
					'translate': 'archive.volume.sequence'
				}, {
					'name': 'size',
					'sortable': 'false',
					'fillCell': function(cell, key, volume) {
						cell.text(convertSize(volume.size));
					},
					'translate': 'archive.volume.size'
				}, {
					'name': 'media',
					'sortable': 'false',
					'fillCell': function(cell, key, volume) {
						cell.text(volume.media);

						pageMedia.getMediaById(volume.media, function(media) {
							var mediaBttn = $('<a class="ui-btn ui-shadow ui-corner-all ui-btn ui-icon-cloud ui-btn-icon-left" href="#mediaPage"></a>');
							mediaBttn.text(media.name);
							mediaBttn.on('click', function() {
								pageMedia.search(media.name);
							});
							cell.empty().append(mediaBttn);
						});
					},
					'translate': 'archive.volume.media'
				}, {
					'name': 'version',
					'sortable': 'false',
					'fillCell': function(cell, key, volume) {
						if (volume.minversion == volume.maxversion)
							cell.text(volume.minversion);
						else
							cell.text(volume.minversion + ' - ' + volume.maxversion);
					},
					'translate': 'archive.volume.version'
				}]);

				template.find('span[data-name="archiveFilesButton"] a').on('click', function() {
					pageArchiveFile.search('archive: ' + archive.id);
				});

				var userInfo = authService.getUserInfo();
				var restoreBttn = template.find('.RestoreButton a');
				if (userInfo && userInfo.canrestore) {
					restoreBttn.on('click', function() {
						function restoreSucceed() {
							translate($('#restoreArchiveSuccess'));
							$.mobile.changePage("#restoreArchiveSuccess");
						}

						function restoreFailed() {
							translate($('#restoreArchiveFailed'));
							$.mobile.changePage("#restoreArchiveFailed");
						}

						restoreArchive(archive.id, restoreSucceed, restoreFailed);
					});
				} else
					restoreBttn.addClass('ui-state-disabled');
			}
		});
		var paginationCtl = new PaginationCtl(page, model);
		var searchCtl = new SearchCtl(page, model, preSearch);

		$document.on("pagechange", function(event, ui) {
			if (page.is(ui.toPage))
				model.update();
		});

		this.getArchiveById = function(id, forceSync, onSuccess, onError) {
			model.getItemById(id, forceSync, onSuccess, onError);
		}

		function restoreArchive(id, onSuccess, onError) {
			onSuccess = onSuccess || $.noop;
			onError = onError || $.noop;

			var currentUser = authService.getUserInfo();
			var restorePath = config["restore path"].replace('<login>', currentUser.login);

			$.ajax({
				type: 'POST',
				url: config['api url'] + '/api/v1/archive/restore/',
				contentType: "application/json",
				dataType: 'json',
				data: JSON.stringify({
					archive: id,
					nextstart: "now",
					host: config["host"],
					destination: restorePath
				}),
				success: onSuccess,
				error: onError
			});
		}
		this.restoreArchive = restoreArchive;

		this.search = function(lookingFor) {
			searchCtl.search(lookingFor);
		}

		this.update = function() {
			model.fetch();
		}
	}


	function PageArchiveFile() {
		var page = $('#archiveFilesPage');
		translatePage(page);

		function preSearch(input) {
			var search = {};
			var match, regex = /(?:(archive|mimetype):\s*)?(?:"([^"\\]*(?:\\.[^"\\]*)*)"|([^'"\n\s]+)|'([^'\\]*(?:\\.[^'\\]*)*)')/g;

			var lems = [];
			while ((match = regex.exec(input)) != null) {
				var matched = match[2] || match[3] || match[4] || match[5] || match[6] || match[7];
				if (match[1])
					search[match[1]] = matched;
				else
					lems.push(matched);
			}

			if (lems.length > 1)
				search.name = '(?:.*(' + lems.join('|') + ')){' + lems.length + '}';
			else if (lems.length == 1)
				search.name = lems[0];

			return search;
		}

		function listIcon(archivefile) {
			return config["api url"] + "/api/v1/archivefile/preview/?id=" + archivefile.id + "&type=image/jpeg";
		}

		function checkImageProxy(archivefile, isImageProxy, isNotImageProxy) {
			$.ajax({
				type: "HEAD",
				url: config["api url"] + "/api/v1/archivefile/preview/?id=" + archivefile.id + "&type=image/jpeg",
				context: archivefile,
				success: isImageProxy,
				error: isNotImageProxy ? isNotImageProxy : $.noop
			});
		}

		function checkSoundProxy(archivefile, isImageProxy, isNotImageProxy) {
			$.ajax({
				type: "HEAD",
				url: config["api url"] + "/api/v1/archivefile/preview/?id=" + archivefile.id + "&type=audio/mpeg",
				context: archivefile,
				success: isImageProxy,
				error: isNotImageProxy ? isNotImageProxy : $.noop
			});
		}

		function checkVideoProxy(archivefile, isVideoProxy, isNotVideoProxy) {
			$.ajax({
				type: "HEAD",
				url: config["api url"] + "/api/v1/archivefile/preview/?id=" + archivefile.id + "&type=video/mp4",
				context: archivefile,
				success: isVideoProxy,
				error: isNotVideoProxy ? isNotVideoProxy : $.noop
			});
		}

		var model = new ModelAjax("/api/v1/archivefile/", 'archivefile', 'archivefiles');
		model.addObserver({
			'fetch': function() {
				var results = model.getResult();
				for (var i = 0, n = results.length; i < n; i++) {
					var archivefile = results[i];
					archivefile.proxy = {
						'audio': null,
						'image': null,
						'video': null
					}

					checkSoundProxy(archivefile, function() {
						this.proxy.audio = true;
					}, function() {
						this.proxy.audio = false;
					});

					checkImageProxy(archivefile, function() {
						this.proxy.image = true;
					}, function() {
						this.proxy.image = false;
					});

					checkVideoProxy(archivefile, function() {
						this.proxy.video = true;
					}, function() {
						this.proxy.video = false;
					});
				}
			}
		});
		var listViewCtl = new ListViewCtl(page.find('#archiveFilesList'), model, {
			icon: config['proxy'] ? listIcon : null,
			title: function(archivefile) {
				var rg = new RegExp('^' + config['home directory'].replace('<login>', '.*'));
				var mt = rg.exec(archivefile.name);
				if (mt !== null)
					return archivefile.name.substr(mt[0].length);

				var userInfo = authService.getUserInfo();
				return archivefile.name.substr(userInfo.homedirectory.length);
			},
			template: 'template/archiveFiles.html',
			fillTemplate: function(template, archivefile) {
				translate(template);

				var base_directory = archivefile.parent.replace(/\/+$/, '').split('/').slice(0, -1).join('/');
				template.find('span[data-name="name"]').text(archivefile.name.substr(base_directory.length + 1));
				template.find('span[data-name="mimetype"]').text(archivefile.mimetype);
				template.find('span[data-name="owner"]').text(archivefile.owner);
				template.find('span[data-name="groups"]').text(archivefile.groups);
				template.find('span[data-name="ctime"]').text(translateDateTime(archivefile.ctime));
				template.find('span[data-name="mtime"]').text(translateDateTime(archivefile.mtime));
				template.find('span[data-name="size"]').text(convertSize(archivefile.size) + ' (' + translatePlural("size.long", archivefile.size, {size: archivefile.size}) + ')');

				var metadata = template.find('span[data-name="metadata"]');
				$.ajax({
					type: 'GET',
					url: config["api url"] + "/api/v1/archivefile/metadata/",
					data: { id: archivefile.id },
					success: function(response) {
						metadata.text(JSON.stringlify(response));
					},
					error: function() {
						metadata.text(translateGetKey('file.template.no_metadata'));
					}
				});

				if (archivefile.minver == archivefile.maxver)
					template.find('span[data-name="version"]').text(archivefile.minver);
				else
					template.find('span[data-name="version"]').text(archivefile.minver + ' - ' + archivefile.maxver);

				var archiveSelect = template.find('select[data-name="listLabelSelect"]');
				for (var id in archivefile.archives)
					pageArchive.getArchiveById(id, true, function(archive) {
						archiveSelect.append('<option value="' + archive.uuid + '">' + archive.name + ' (' + archivefile.archives[archive.id].join(", ") + ')</option>');
					});

				template.find('.archiveFButton a').on('click', function() {
					pageArchive.search('uuid: ' + archiveSelect.val());
				});

				var previewBttn = template.find('a.preview');
				if (!config['proxy'])
					previewBttn.remove();
				else {
					previewBttn.addClass('ui-state-disabled');

					function setProxyAudio() {
						previewBttn.removeClass('ui-state-disabled');
						previewBttn.on('click', function() {
							pagePreview.loadSoundPreview(archivefile);
						});
					}

					function setProxyImage() {
						previewBttn.removeClass('ui-state-disabled');
						previewBttn.on('click', function() {
							pagePreview.loadImagePreview(archivefile);
						});
					}

					function setProxyVideo() {
						previewBttn.removeClass('ui-state-disabled');
						previewBttn.on('click', function() {
							pagePreview.loadVideoPreview(archivefile);
						});
					}

					checkSoundProxy(archivefile, setProxyAudio);
					checkImageProxy(archivefile, setProxyImage);
					checkVideoProxy(archivefile, setProxyVideo);
				}

				var restoreBttn = template.find('a.restore');

				if (archivefile.mimetype == "inode/directory")
					restoreBttn.filter('.file').remove();
				else
					restoreBttn.filter('.folder').remove();

				var userInfo = authService.getUserInfo();
				if (userInfo && userInfo.canrestore) {
					restoreBttn.on('click', function() {
						function restoreSucceed() {
							translate($('#restoreArchiveSuccess'));
							$.mobile.changePage("#restoreArchiveSuccess");
						}

						function restoreFailed() {
							translate($('#restoreArchiveFailed'));
							$.mobile.changePage("#restoreArchiveFailed");
						}

						var archives = Object.keys(archivefile.archives);
						archives.sort();
						restoreArchiveFile(parseInt(archives[0]), [archivefile.name], restoreSucceed, restoreFailed);
					});
				} else
					restoreBttn.addClass('ui-state-disabled');
			}
		});
		var galleryViewCtl = new GalleryViewCtl(page.find('#ArchiveFilesTabGallery > ul'), model, {
			action: {
				'click': function(event) {
					var archivefile = event.data;
					if (archivefile.proxy.image)
						pagePreview.loadImagePreview(archivefile);
					else if (archivefile.proxy.audio)
						pagePreview.loadSoundPreview(archivefile);
					else if (archivefile.proxy.video)
						pagePreview.loadVideoPreview(archivefile);

					if (archivefile.proxy.image || archivefile.proxy.video)
						$.mobile.changePage("#previewPage");
				}
			},
			widget: function(archivefile) {
				var img = $('<img class="no-proxy" src="img/file_does_not_exists.png">');

				function setImage() {
					img.replaceWith('<img class="ui-li-thumb" src="' + config["api url"] + "/api/v1/archivefile/preview/?id=" + archivefile.id + "&type=image/jpeg" + '" />');
				}

				function setVideo() {
					var video = $('<video class="ui-li-thumb"></video>');
					video.append('<source src="' + config["api url"] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=video/mp4" type="video/mp4" />');
					video.append('<source src="' + config["api url"] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=video/ogv" type="video/ogg" />');
					img.replaceWith(video);
				}

				checkImageProxy(archivefile, setImage);
				checkVideoProxy(archivefile, setVideo);

				return img;
			},
			header: function(archivefile) {
				return archivefile.name.split('/').pop();
			},
			label: function(archivefile) {
				var userInfo = authService.getUserInfo();
				var filename_parts = archivefile.name.substr(userInfo.homedirectory.length).split('/');
				filename_parts.pop();
				return filename_parts.join('/');
			},
			has_icon: function(archivefile) {
				return archivefile.mimetype.startsWith('video/');
			},
			icon: function(archivefile) {
				return $('<img class="icon" />');
			}
		});
		var paginationCtl = new PaginationCtl(page, model);
		var searchCtl = new SearchCtl(page, model, preSearch);

		$document.on("pagechange", function(event, ui) {
			if (page.is(ui.toPage))
				model.update();
		});

		var tabs = page.find('[data-role="tabs"]');
		var tabGallery = tabs.find('[data-role="navbar"] li').has('[href="#ArchiveFilesTabGallery"]');
		var tabList = tabs.find('[data-role="navbar"] li').has('[href="#ArchiveFilesTabList"]');
		var navBar = tabs.find('.ui-navbar');

		if (config['proxy'])
			tabs.tabs({
				beforeActivate: function(event, ui) {
					if (ui.newTab.is(tabGallery))
						galleryViewCtl.refresh();
					else if (ui.newTab.is(tabList))
						listViewCtl.refresh();
				}
			});
		else
			navBar.hide();

		function restoreArchiveFile(archive, files, onSuccess, onError) {
			onSuccess = onSuccess || $.noop;
			onError = onError || $.noop;

			var currentUser = authService.getUserInfo();
			var restorePath = config["restore path"].replace('<login>', currentUser.login);

			$.ajax({
				type: 'POST',
				url: config['api url'] + '/api/v1/archive/restore/',
				contentType: "application/json",
				dataType: 'json',
				data: JSON.stringify({
					archive: archive,
					files: files,
					nextstart: "now",
					host: config["host"],
					destination: restorePath
				}),
				success: onSuccess,
				error: onError
			});
		}

		this.search = function(lookingFor) {
			searchCtl.search(lookingFor);
		}

		this.update = function() {
			model.fetch();
		}
	}


	function PagePreview() {
		var page = $('#previewPage');
		translatePage(page);

		var divPreview = page.find('.preview');
		var audio = page.find('audio');
		var image = page.find('img.imagePreview');
		var video = page.find('video');
		var lblName = page.find('ul span[data-name="name"]');
		var lblMimetype = page.find('ul span[data-name="mimetype"]');
		var lblSize = page.find('ul span[data-name="size"]');
		var lblMetadata = page.find('ul span[data-name="metadata"]');
		var currentArchiveFile = null;

		this.loadImagePreview = function(archivefile) {
			if (currentArchiveFile) {
				audio.children().remove();
				video.children().remove();
			}

			if (currentArchiveFile == null || currentArchiveFile.id != archivefile.id) {
				audio.hide();
				image.show();
				video.hide();

				divPreview.removeClass('audio video').addClass('image');
				image.attr('src', config['api url'] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=image/jpeg');

				loadMetadata(archivefile);

				currentArchiveFile = archivefile;
			}
		}

		this.loadSoundPreview = function(archivefile) {
			if (currentArchiveFile) {
				audio.children().remove();
				video.children().remove();
			}

			if (currentArchiveFile == null || currentArchiveFile.id != archivefile.id) {
				audio.show();
				image.hide();
				video.hide();

				divPreview.removeClass('image video').addClass('audio');
				audio.append('<source src="' + config['api url'] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=audio/mpeg" type="audio/mpeg" />');
				audio[0].load();

				loadMetadata(archivefile);

				currentArchiveFile = archivefile;
			}
		}

		this.loadVideoPreview = function(archivefile) {
			if (currentArchiveFile) {
				audio.children().remove();
				video.children().remove();
			}

			if (currentArchiveFile == null || currentArchiveFile.id != archivefile.id) {
				audio.hide();
				image.hide();
				video.show();

				divPreview.removeClass('audio image').addClass('video');
				video.append('<source src="' + config['api url'] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=video/mp4" type="video/mp4" />');
				video.append('<source src="' + config['api url'] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=video/ogv" type="video/ogg" />');
				video[0].load();

				loadMetadata(archivefile);

				currentArchiveFile = archivefile;
			}
		}

		function loadMetadata(archivefile) {
			var base_directory = archivefile.parent.replace(/\/+$/, '').split('/').slice(0, -1).join('/');
			lblName.text(archivefile.name.substr(archivefile.name.substr(base_directory.length + 1)));
			lblMimetype.text(archivefile.mimetype);
			lblSize.text(convertSize(archivefile.size) + ' (' + archivefile.size.toLocaleString() + ' bytes)');

			$.ajax({
				type: 'GET',
				url: config["api url"] + "/api/v1/archivefile/metadata/",
				data: { id: archivefile.id },
				success: function(response) {
					lblMetadata.text(JSON.stringlify(response));
				},
				error: function() {
					lblMetadata.text("No metadata found for this object");
				}
			});
		}

		$document.on("pagechange", function(event, ui) {
			if (!page.is(ui.toPage)) {
				audio[0].pause();
				video[0].pause();
			}
		});
	}


	function PageMedia() {
		var page = $('#mediaPage');
		translatePage(page);

		function preSearch(input) {
			var search = {};
			var match, regex = /(?:(pool|nbfiles|archiveformat|mediaformat|type):\s*)?(?:"([^"\\]*(?:\\.[^"\\]*)*)"|([^'"\n\s]+)|'([^'\\]*(?:\\.[^'\\]*)*)')/g;

			var lems = [];
			while ((match = regex.exec(input)) != null) {
				var matched = match[2] || match[3] || match[4] || match[5] || match[6] || match[7];
				if (match[1])
					search[match[1]] = matched;
				else
					lems.push(matched);
			}

			if (lems.length > 1)
				search.name = '(?:.*(' + lems.join('|') + ')){' + lems.length + '}';
			else if (lems.length == 1)
				search.name = lems[0];

			return search;
		}

		var model = new ModelAjax("/api/v1/media/", 'media', 'medias');
		var listViewCtl = new ListViewCtl(page.find('#mediaList'), model, {
			title: function(media) {
				return media.name;
			},
			template: 'template/media.html',
			fillTemplate: function(template, media) {
				translate(template);

				template.find('span[data-name="name"]').text(media.name);
				template.find('span[data-name="label"]').text(media.label);
				if (media.pool)
					template.find('span[data-name="pool"]').text(media.pool.name);
				template.find('span[data-name="format"]').text(media.mediaformat.name);
				template.find('span[data-name="uuid"]').text(media.uuid);
				template.find('span[data-name="firstused"]').text(translateDateTime(media.firstused));
				template.find('span[data-name="usebefore"]').text(translateDateTime(media.usebefore));

				var spaceUsed = template.find('div[data-name="spaceused"]');
				var meter = spaceUsed.find('meter');
				var label = spaceUsed.find('label');

				var used = media.blocksize * (media.totalblock - media.freeblock);
				meter.attr('min', 0);
				meter.attr('max', media.totalblock * media.blocksize);
				meter.attr('value', used);
				label.text(convertSize(used) + ' / ' + convertSize(media.totalblock * media.blocksize));
			}
		});
		var paginationCtl = new PaginationCtl(page, model);
		var searchCtl = new SearchCtl(page, model, preSearch);

		$document.on("pagechange", function(event, ui) {
			if (page.is(ui.toPage))
				model.update();
		});

		this.getMediaById = function(id, onSuccess, onError) {
			model.getItemById(id, onSuccess, onError);
		}

		this.search = function(lookingFor) {
			searchCtl.search(lookingFor);
		}

		this.update = function() {
			model.fetch();
		}
	}


	function PageAdministration() {
		var page = $('#administrationPage');
		translatePage(page);

		function preSearch(input) {
			var search = {};
			var match, regex = /(can(?:not)?):\s*(archive|restore)|(is(?:not)?):\s*(admin|enabled|disabled)|(?:(poolgroup):\s*)?(?:"([^"\\]*(?:\\.[^"\\]*)*)"|([^'"\n\s]+)|'([^'\\]*(?:\\.[^'\\]*)*)')/g;

			var lems = [];
			while ((match = regex.exec(input)) != null) {
				var matched = match[6] || match[7] || match[8];
				if (match[1]) {
					var can = match[1] == 'can';
					if (match[2] == 'archive')
						search.canarchive = can;
					else
						search.canrestore = can;
				} else if (match[3]) {
					var is = match[3] == 'is';

					if (match[4] == 'admin')
						search.isadmin = is;
					else
						search.disabled = is ^ (match[4] == 'enabled') ? true : false;
				} else if (match[5]) {
					search[match[5]] = matched;
				} else
					lems.push(matched);
			}

			if (lems.length > 1)
				search.login = '(?:.*(' + lems.join('|') + ')){' + lems.length + '}';
			else if (lems.length == 1)
				search.login = lems[0];

			return search;
		}

		var model = new ModelAjax("/api/v1/user/", 'user', 'users');
		var listViewCtl = new ListViewCtl(page.find('#administrationList'), model, {
			title: function(user) {
				return user.login;
			},
			template: 'template/administration.html',
			fillTemplate: function(template, user) {
				translate(template);

				template.find('span[data-name="id"]').text(user.id);
				template.find('span[data-name="login"]').text(user.login);
				template.find('span[data-name="fullname"]').text(user.fullname);
				template.find('span[data-name="email"]').text(user.email);
				if (config["home directory"])
					template.find('span[data-name="homedirectory"]').parent().hide();
				else
					template.find('span[data-name="homedirectory"]').text(user.homedirectory);
				template.find('span[data-name="isadmin"]').text(user.isadmin);
				if (config["default permission"]["archive"] !== null)
					template.find('span[data-name="canarchive"]').parent().hide();
				else
					template.find('span[data-name="canarchive"]').text(user.canarchive);
				if (config["default permission"]["restore"] !== null)
					template.find('span[data-name="canrestore"]').parent().hide();
				else
					template.find('span[data-name="canrestore"]').text(user.canrestore);
				template.find('span[data-name="disabled"]').text(user.disabled);

				var pg = template.find('span[data-name="poolgroup"]');
				if (user.poolgroup) {
					pg.text(user.poolgroup);
					getPoolGroupById(user.poolgroup, function(poolgroup) {
						pg.text(poolgroup.name);
					});
				} else
					pg.text('no poolgroup affected');

				template.find('a.edit').on('click', function() {
					pageUser.editUser(user, false);
				});

				var currentUser = authService.getUserInfo();

				var deleteUserBttn = template.find('a.remove');
				if (currentUser.id != user.id) {
					deleteUserBttn.on('click', function() {
						$.ajax({
							type: "DELETE",
							url: config["api url"] + "/api/v1/user/?id=" + user.id,
							dataType: 'json',
							success: function(response) {
								translate($('#removeUserSuccess'));
								$.mobile.changePage("#removeUserSuccess");
								model.fetch();
							},
							error: function(XMLHttpRequest, textStatus, errorThrown) {
								translate($('#removeUserFailed'));
								$.mobile.changePage("#removeUserFailed");
								model.fetch();
							}
						});
					});
				} else
					deleteUserBttn.addClass('ui-state-disabled');
			}
		});
		var paginationCtl = new PaginationCtl(page, model);
		var searchCtl = new SearchCtl(page, model, preSearch);

		page.find('#AddButton').on('click', function() {
			pageUser.newUser();
		});

		$document.on("pagechange", function(event, ui) {
			if (page.is(ui.toPage)) {
				var currentUser = authService.getUserInfo();

				if (currentUser.isadmin)
					model.update();
				else
					$(":mobile-pagecontainer").pagecontainer("change", "#archivePage");
			}
		});

		this.discardUserById = function(id) {
			model.discardItemById(id);
		}

		this.update = function() {
			model.fetch();
		}
	}


	function PageUser() {
		var page = $('#modUserPage');
		translatePage(page);

		var headerAddUser = page.find('#headerAdd');
		var headerEditUser = page.find('#headerEdit');

		var login = page.find('form input[name="login"]');
		var fullname = page.find('form input[name="fullname"]');
		var password = page.find('form input[name="pwd"]');
		var email = page.find('form input[name="email"]');
		var homeDirectory = page.find('form input[name="homedir"]');

		var formPermission = page.find('form fieldset');
		var isAdmin = page.find('form input#canadmin');
		var canArchive = page.find('form input#canarchive');
		var canRestore = page.find('form input#canrestore');
		var disabled = page.find('form input#disabled');

		var addUserBttn = page.find('form #addUserButton');
		var editUserBttn = page.find('form #editButton');

		var backBttn = page.find('#backUserPage');

		if (config["home directory"])
			homeDirectory.parentsUntil('ul', 'li').hide();
		else if (config["default home directory"])
			homeDirectory.prop("placeholder", config["default home directory"]);

		var currentUser = null;
		var restrictedMode = false;

		page.find('form').on('submit', function(evt) {
			evt.target.checkValidity();
			return false;
		});

		// jQuery mobile hack
		var isPageInitialized = false;
		$document.on("pagechange", function(event, ui) {
			if (page.is(ui.toPage) && !isPageInitialized) {
				isPageInitialized = true;

				if (config["default permission"]["archive"] !== null)
					page.find('form div.ui-checkbox').has('#canarchive').hide();
				if (config["default permission"]["restore"] !== null)
					page.find('form div.ui-checkbox').has('#canrestore').hide();

				if (currentUser)
					editUser(currentUser, restrictedMode);
				else
					newUser();
			}
		});

		function editUser(user, restricted) {
			currentUser = user;
			restrictedMode = restricted;

			if (!isPageInitialized)
				return;

			headerAddUser.hide();
			headerEditUser.show();

			login.val(user.login);
			fullname.val(user.fullname);
			password.val('');
			email.val(user.email);
			homeDirectory.val(user.homedirectory);

			isAdmin.prop('checked', user.isadmin).checkboxradio("refresh");
			canArchive.prop('checked', user.canarchive).checkboxradio("refresh");
			canRestore.prop('checked', user.canrestore).checkboxradio("refresh");
			disabled.prop('checked', user.disabled).checkboxradio("refresh");

			addUserBttn.parent().hide();
			editUserBttn.parent().show();

			setRestrictedMode(restrictedMode);
		}
		this.editUser = editUser;

		function newUser() {
			currentUser = null;

			if (!isPageInitialized)
				return;

			headerAddUser.show();
			headerEditUser.hide();

			login.val('');
			fullname.val('');
			password.val('');
			email.val('');
			homeDirectory.val('');

			isAdmin.prop('checked', false).checkboxradio("refresh");
			canArchive.prop('checked', false).checkboxradio("refresh");
			canRestore.prop('checked', false).checkboxradio("refresh");
			disabled.prop('checked', false).checkboxradio("refresh");

			addUserBttn.parent().show();
			editUserBttn.parent().hide();

			setRestrictedMode(false);
		}
		this.newUser = newUser;

		function setRestrictedMode(restrict) {
			function enableInput(input, disable) {
				if (disable)
					input.addClass('ui-state-disabled');
				else
					input.removeClass('ui-state-disabled');
			}

			enableInput(login, restrict);

			var loggedUser = authService.getUserInfo();
			enableInput(formPermission.find('.ui-controlgroup-controls'), restrict);
			if (!restrict) {
				enableInput(isAdmin.parent(), currentUser && currentUser.id == loggedUser.id);
				enableInput(disabled.parent(), currentUser && currentUser.id == loggedUser.id);
			}
		}

		addUserBttn.on('click', function() {
			if (currentUser !== null) {
				editUserBttn.trigger('click');
				return;
			}

			$.mobile.loading( "show");

			var newLogin = login.val();
			var newHomeDirectory = homeDirectory.val();
			if (config["home directory"])
				newHomeDirectory = config["home directory"].replace("<login>", newLogin);

			var newCanArchive = canArchive.is(':checked');
			if (config["default permission"]["archive"] !== null)
				newCanArchive = config["default permission"]["archive"];

			var newCanRestore = canRestore.is(':checked');
			if (config["default permission"]["restore"] !== null)
				newCanRestore = config["default permission"]["restore"];

			var adminUser = authService.getUserInfo();

			$.ajax({
				url: config['api url'] + '/api/v1/user/',
				type: "POST",
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					login: newLogin,
					fullname: fullname.val(),
					password: password.val(),
					email: email.val(),
					homedirectory: newHomeDirectory,
					isadmin: isAdmin.is(':checked'),
					canarchive: newCanArchive,
					canrestore: newCanRestore,
					poolgroup: adminUser.poolgroup,
					disabled: disabled.is(':checked')
				}),
				success: function(response) {
					pageAdministration.update();

					var dialog = $("#addUserSuccess");
					translate(dialog);
					$.mobile.changePage("#addUserSuccess");
					$.mobile.loading("hide");

					var as = dialog.find('a');
					dialog.find('a').on('click', function() {
						as.off();
						$(":mobile-pagecontainer").pagecontainer("change", "#administrationPage");
					});
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					translate($("#addUserFailed"));
					$.mobile.changePage("#addUserFailed");
					$.mobile.loading("hide");
				}
			});
		});

		editUserBttn.on('click', function() {
			$.mobile.loading("show");

			var userInfo = {
				id: currentUser.id,
				login: login.val(),
				fullname: fullname.val(),
				email: email.val(),
				homedirectory: homeDirectory.val(),
				isadmin: isAdmin.is(':checked'),
				canarchive: canArchive.is(':checked'),
				canrestore: canRestore.is(':checked'),
				meta: currentUser.meta,
				poolgroup: currentUser.poolgroup,
				disabled: disabled.is(':checked')
			};

			if (password.val().length > 0)
				userInfo['password'] = password.val();

			$.ajax({
				type: "PUT",
				url: config["api url"] + "/api/v1/user/",
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify(userInfo),
				success: function(response) {
					newUser();

					pageAdministration.discardUserById(userInfo.id);
					pageAdministration.update();

					var dialog = $("#editUserSuccess");
					translate(dialog);
					$.mobile.changePage("#editUserSuccess");
					$.mobile.loading("hide");

					var as = dialog.find('a');
					dialog.find('a').on('click', function() {
						as.off();
						$(":mobile-pagecontainer").pagecontainer("change", "#administrationPage");
					});
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					translate($("#editUserFailed"));
					$.mobile.changePage("#editUserFailed");
					$.mobile.loading("hide");
				}
			});
		});

		backBttn.on('click', function() {
			if (restrictedMode)
				$(":mobile-pagecontainer").pagecontainer("change", "#archivePage");
			else
				$(":mobile-pagecontainer").pagecontainer("change", "#administrationPage");
		});
	}


	$("[data-role=panel]").enhanceWithin().panel();
	translate($('#menu'));

	var pageAuth = new PageAuth();
	var pageArchive = new PageArchive();
	var pageArchiveFile = new PageArchiveFile();
	var pagePreview = new PagePreview();
	var pageMedia = new PageMedia();
	var pageAdministration = new PageAdministration();
	var pageUser = new PageUser();

	$('.disconnection_button').on('click', authService.doLogOut);

	// Menu icon redirect to Intellique website
	var closeMenuItem = $('#menu li:last-child a');
	$('#iconMenu').on('click', function() {
		window.open("http://www.intellique.com/");
		closeMenuItem.trigger('click');
	});

	// Menu account in order to edit current user information
	$('#accountPage').on('click', function() {
		var currentUser = authService.getUserInfo();
		pageUser.editUser(currentUser, !currentUser.isadmin);
	});
}


})(window, jQuery);
