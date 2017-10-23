(function(window, $) {
"use strict";

var config = null;
$.ajax({
	type: 'GET',
	url: 'config.json',
	success: function(newConfig) {
		config = newConfig;

		authService.checkAuth(function() {
			$(":mobile-pagecontainer").pagecontainer("change", "#archivePage");
			main();
		}, function() {
			$(":mobile-pagecontainer").pagecontainer("change", "#authentification_page");
			main();
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

				currentUserInfo = getUserInfo(response.user_id, function(response) {
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

	function notConnected(onError) {
		onError = onError || $.noop;

		return function(response) {
			if (currentUserInfo) {
				currentUserInfo = null;

				window.clearInterval(authTimer);
				authTimer = null;

				$.mobile.changePage(config["simple-ui url"] + "/dialog/timeout.html", { role: "dialog" });
				$(":mobile-pagecontainer").pagecontainer("change", "#authentification_page");
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

	this.doLogOut = function() {
		$.ajax({
			type: "DELETE",
			url: config["api url"] + "/api/v1/auth/",
			success: function() {
				currentUserInfo = null;

				window.clearInterval(authTimer);
				authTimer = null;

				$(":mobile-pagecontainer").pagecontainer("change", "#authentification_page");
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
			type = " B";
			break;
		case 1:
			type = " KB";
			break;
		case 2:
			type = " MB";
			break;
		case 3:
			type = " GB";
			break;
		case 4:
			type = " TB";
			break;
		default:
			type = " PB";
		break;
	}

	return size.toFixed(width) + type;
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


function ListViewCtl(list, model, factory) {
	model.addObserver({
		prefetch: function() {
			list.delay(200).animate({opacity: '0.5'});
			$.mobile.loading( "show");
		},
		fetch: function() {
			list.stop(true, false).animate({opacity: '1'}, 500);
			list.empty();

			$.mobile.loading("hide");

			if (list.is(':hidden'))
				return;

			var results = model.getResult();
			for (var i = 0, n = results.length; i < n; i++) {
				var item = $('<div data-role="collapsible"></div>');

				var title = $('<h2 class="ui-collapsible-heading"></h2>');
				var a = $('<a class="ui-collapsible-heading-toggle ui-btn ui-btn-icon-left ui-btn-a ui-icon-plus">' + factory.title(results[i]) + '</a>');

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
	});
}


function Model(observers) {
	var limit =	10, offset = 0;

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

			nbElts.text(totalRows).stop(true, false).animate({opacity: '1'}, 500);
			pageN.text((offset + 1) + ' on ' + (offset + limit > totalRows ? totalRows : offset + limit)).stop(true, false).animate({opacity: '1'}, 500);

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
			$(document).off("pagechange", deferred);
		}
	}
	$(document).on("pagechange", deferred);

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
		var th = $('<th />');
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


function main() {
	function PageAuth() {
		var page = $('#authentification_page');

		var loginInput = page.find('#identifiant');
		var passwordInput = page.find('#password');
		var submitWrapper = null;

		function deferred() {
			submitWrapper = page.find('div > #log_in_button').parent();
			if (submitWrapper.length == 0)
				return;

			loginInput.on('keyup', submitEnabled);
			loginInput.next().on('click', submitEnabled);
			passwordInput.on('keyup', submitEnabled);
			passwordInput.next().on('click', submitEnabled);
			submitEnabled();

			$(document).off("pagechange", deferred);
		}
		$(document).on("pagechange", deferred);
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
				$.mobile.changePage(config["simple-ui url"] + "/dialog/authfailed.html", { role: "dialog" });
				$.mobile.loading("hide");
			});

			return false;
		});
	}


	function PageArchive() {
		var page = $('#archivePage');

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
				template.find('span[data-name="uuid"]').text(archive.uuid);
				template.find('span[data-name="starttime"]').text(archive.volumes[0].starttime.date);
				template.find('span[data-name="endtime"]').text(archive.volumes[archive.volumes.length - 1].endtime.date);
				template.find('span[data-name="size"]').text(convertSize(archive.size) + " (" + archive.size.toLocaleString() + " bytes)");
				template.find('span[data-name="owner"]').text(archive.owner);
				template.find('span[data-name="creator"]').text(archive.creator);
				template.find('span[data-name="canappend"]').text(archive.canappend);

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
				} else
					tableMetadata.replaceWith('<span>No metadata found for this object</span>');

				var modelVolumes = new ModelVolume(archive.volumes);
				var table = new TableView(template.find('table.volume'), modelVolumes, [{
					'name': 'sequence',
					'sortable': 'false',
					'fillCell': function(cell, key, volume) {
						cell.text(volume.sequence);
					}
				}, {
					'name': 'size',
					'sortable': 'false',
					'fillCell': function(cell, key, volume) {
						cell.text(convertSize(volume.size));
					}
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
					}
				}]);

				template.find('span[data-name="archiveFilesButton"] a').on('click', function() {
					pageArchiveFile.search('archive: ' + archive.id);
				});

				var userInfo = authService.getUserInfo();
				var restoreBttn = template.find('.RestoreButton a');
				if (userInfo && userInfo.canrestore) {
					restoreBttn.on('click', function() {
						function restoreSucceed() {
							$.mobile.changePage(config["simple-ui url"] + "/dialog/rSuccess.html", { role: "dialog" });
						}

						function restoreFailed() {
							$.mobile.changePage(config["simple-ui url"] + "/dialog/rFailed.html", { role: "dialog" });
						}

						restoreArchive(archive.id, restoreSucceed, restoreFailed);
					});
				} else
					restoreBttn.addClass('ui-state-disabled');
			}
		});
		var paginationCtl = new PaginationCtl(page, model);
		var searchCtl = new SearchCtl(page, model, preSearch);

		$(document).on("pagechange", function(event, ui) {
			if (page.is(ui.toPage))
				model.update();
		});

		this.getArchiveById = function(id, forceSync, onSuccess, onError) {
			model.getItemById(id, forceSync, onSuccess, onError);
		}

		function restoreArchive(id, onSuccess, onError) {
			onSuccess = onSuccess || $.noop;
			onError = onError || $.noop;

			$.ajax({
				type: 'POST',
				url: config['api url'] + '/api/v1/archive/restore/',
				contentType: "application/json",
				dataType: 'json',
				data: JSON.stringify({
					archive: id,
					nextstart: "now",
					host: config["host"],
					destination: config["restore path"]
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

		var model = new ModelAjax("/api/v1/archivefile/", 'archivefile', 'archivefiles');
		var listViewCtl = new ListViewCtl(page.find('#archiveFilesList'), model, {
			title: function(archivefile) {
				return archivefile.name;
			},
			template: 'template/archiveFiles.html',
			fillTemplate: function(template, archivefile) {
				template.find('span[name="name"]').text(archivefile.name);
				template.find('span[name="mimetype"]').text(archivefile.mimetype);
				template.find('span[name="owner"]').text(archivefile.owner);
				template.find('span[name="groups"]').text(archivefile.groups);
				template.find('span[name="ctime"]').text(archivefile.ctime);
				template.find('span[name="mtime"]').text(archivefile.mtime);
				template.find('span[name="size"]').text(convertSize(archivefile.size) + ' (' + archivefile.size.toLocaleString() + ' bytes)');

				var metadata = template.find('span[name="metadata"]');
				$.ajax({
					type: 'GET',
					url: config["api url"] + "/api/v1/archivefile/metadata/",
					data: { id: archivefile.id },
					success: function(response) {
						metadata.text(JSON.stringlify(response));
					},
					error: function() {
						metadata.text("No metadata found for this object");
					}
				});

				var archiveSelect = template.find('select[name="listLabelSelect"]');
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

					$.ajax({
						type: "HEAD",
						url: config["api url"] + "/api/v1/archivefile/preview/?id=" + archivefile.id + "&type=video/mp4",
						success: function() {
							previewBttn.removeClass('ui-state-disabled');
							previewBttn.on('click', function() {
								pagePreview.loadPreview(archivefile);
							});
						}
					});
				}

				var userInfo = authService.getUserInfo();
				var restoreBttn = template.find('a.restore');
				if (userInfo && userInfo.canrestore) {
					restoreBttn.on('click', function() {
						function restoreSucceed() {
							$.mobile.changePage(config["simple-ui url"] + "/dialog/rSuccess.html", { role: "dialog" });
						}

						function restoreFailed() {
							$.mobile.changePage(config["simple-ui url"] + "/dialog/rFailed.html", { role: "dialog" });
						}

						var archives = Object.keys(archivefile.archives);
						archives.sort();
						restoreArchiveFile(parseInt(archives[0]), [archivefile.name], restoreSucceed, restoreFailed);
					});
				} else
					restoreBttn.addClass('ui-state-disabled');
			}
		});
		var paginationCtl = new PaginationCtl(page, model);
		var searchCtl = new SearchCtl(page, model, preSearch);

		$(document).on("pagechange", function(event, ui) {
			if (page.is(ui.toPage))
				model.update();
		});

		function restoreArchiveFile(archive, files, onSuccess, onError) {
			onSuccess = onSuccess || $.noop;
			onError = onError || $.noop;

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
					destination: config["restore path"]
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
		var video = page.find('video');
		var lblName = page.find('ul span[data-name="name"]');
		var lblMimetype = page.find('ul span[data-name="mimetype"]');
		var lblSize = page.find('ul span[data-name="size"]');
		var lblMetadata = page.find('ul span[data-name="metadata"]');
		var currentArchiveFile = null;

		this.loadPreview = function(archivefile) {
			if (currentArchiveFile && currentArchiveFile.id != archivefile.id)
				video.children().remove();

			if (currentArchiveFile == null || currentArchiveFile.id != archivefile.id) {
				video.append('<source src="' + config['api url'] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=video/mp4" type="video/mp4" />');
				video.append('<source src="' + config['api url'] + '/api/v1/archivefile/preview/?id=' + archivefile.id + '&type=video/ogv" type="video/ogg" />');
				video[0].load();

				lblName.text(archivefile.name);
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

				currentArchiveFile = archivefile;
			}
		}

		$(document).on("pagechange", function(event, ui) {
			if (!page.is(ui.toPage))
				video[0].pause();
		});
	}


	function PageMedia() {
		var page = $('#mediaPage');

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
				template.find('span[data-name="name"]').text(media.name);
				template.find('span[data-name="label"]').text(media.label);
				if (media.pool)
					template.find('span[data-name="pool"]').text(media.pool.name);
				template.find('span[data-name="format"]').text(media.mediaformat.name);
				template.find('span[data-name="uuid"]').text(media.uuid);
				template.find('span[data-name="firstused"]').text(media.firstused.date);
				template.find('span[data-name="usebefore"]').text(media.usebefore.date);

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

		$(document).on("pagechange", function(event, ui) {
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
				template.find('span[data-name="id"]').text(user.id);
				template.find('span[data-name="login"]').text(user.login);
				template.find('span[data-name="fullname"]').text(user.fullname);
				template.find('span[data-name="email"]').text(user.email);
				template.find('span[data-name="homedirectory"]').text(user.homedirectory);
				template.find('span[data-name="isadmin"]').text(user.isadmin);
				template.find('span[data-name="canarchive"]').text(user.canarchive);
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
					pageUser.editUser(user);
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
								$.mobile.changePage(config["simple-ui url"] + "/dialog/removeUserSuccess.html", {role: "dialog"});
								model.fetch();
							},
							error: function(XMLHttpRequest, textStatus, errorThrown) {
								$.mobile.changePage(config["simple-ui url"] + "/dialog/removeUserFail.html", {role: "dialog"});
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

		$(document).on("pagechange", function(event, ui) {
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

		var headerAddUser = page.find('#headerAdd');
		var headerEditUser = page.find('#headerEdit');

		var login = page.find('form input[name="login"]');
		var fullname = page.find('form input[name="fullname"]');
		var password = page.find('form input[name="pwd"]');
		var email = page.find('form input[name="email"]');
		var homeDirectory = page.find('form input[name="homedir"]');

		var isAdmin = page.find('form input#canadmin');
		var canArchive = page.find('form input#canarchive');
		var canRestore = page.find('form input#canrestore');
		var disabled = page.find('form input#disabled');

		var addUserBttn = page.find('form #addUserButton');
		var editUserBttn = page.find('form #editButton');

		var currentUser = null;

		page.find('form').on('submit', function(evt) {
			evt.target.checkValidity();
			return false;
		});

		// jQuery mobile hack
		var isPageInitialized = false;
		$(document).on("pagechange", function(event, ui) {
			if (page.is(ui.toPage) && !isPageInitialized) {
				isPageInitialized = true;

				if (currentUser)
					editUser(currentUser);
				else
					newUser();
			}
		});

		function editUser(user) {
			currentUser = user;

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
		}
		this.newUser = newUser;

		addUserBttn.on('click', function() {
			$.mobile.loading( "show");

			var adminUser = authService.getUserInfo();

			$.ajax({
				url: config['api url'] + '/api/v1/user/',
				type: "POST",
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					login: login.val(),
					fullname: fullname.val(),
					password: password.val(),
					email: email.val(),
					homedirectory: homeDirectory.val(),
					isadmin: isAdmin.is(':checked'),
					canarchive: canArchive.is(':checked'),
					canrestore: canRestore.is(':checked'),
					poolgroup: adminUser.poolgroup,
					disabled: disabled.is(':checked')
				}),
				success: function(response) {
					$.mobile.changePage(config["simple-ui url"] + "/dialog/addUserSuccess.html", {role: "dialog"});
					pageAdministration.update();
					$(":mobile-pagecontainer").pagecontainer("change", "#administrationPage");
					$.mobile.loading("hide");
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					$.mobile.changePage(config["simple-ui url"] + "/dialog/addUserFail.html", {role: "dialog"});
					$.mobile.loading("hide");
				}
			});
		});

		editUserBttn.on('click', function() {
			$.mobile.loading( "show");

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
					$.mobile.changePage(config["simple-ui url"] + "/dialog/editUserSuccess.html", {role: "dialog"});
					pageAdministration.discardUserById(userInfo.id);
					pageAdministration.update();
					$(":mobile-pagecontainer").pagecontainer("change", "#administrationPage");
					$.mobile.loading("hide");
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					$.mobile.changePage(config["simple-ui url"] + "/dialog/editUserFail.html", {role: "dialog"});
					$.mobile.loading("hide");
				}
			});
		});
	}


	$("[data-role=panel]").enhanceWithin().panel();

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
}


})(window, jQuery);
