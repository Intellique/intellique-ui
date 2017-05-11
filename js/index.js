$(document).ready(function()
{
	var configSearchArchive = {
		'url': 'http://taiko/storiqone-backend-my/api/v1/archive',
		'keyData': 'archive',
		'keySearch': 'archives',
		'dataSearch': {},
		'headers': [{
			'name': 'name',
			'sortable': true,
			'translatable': true,
			'transform': function(elt, field, data) {
				aArchiveFiles = $('<p></p>');
				aArchiveFiles.text(data.name);
				elt.append(aArchiveFiles);

				$(elt).find('p').on('click',function()
				{
					var archiveFilesPage = $('#archiveFilesPage');
					var table_head = archiveFilesPage.find('thead tr');
					var table_body = archiveFilesPage.find('tbody');
					table_head.empty();
					table_body.empty();


					var configSearchArchiveFiles = {
						'url': 'http://taiko/storiqone-backend-my/api/v1/archivefile',
						'keyData': 'archivefile',
						'keySearch': 'archivefiles',
						'dataSearch': {
							archive : data.id
										},
						'headers': [{
							'name': 'name',
							'sortable': true,
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data.name);
								}
							}, {
								'name': 'size',
								'sortable': false,
								'translatable': true,
								'transform': function(elt, field, data) {
									elt.text(convertSize(data[field]));
								}
							}],
							'search': function(input) {
								var text = input.val();
								if (text.length > 0)
									this.dataSearch.name = text;
								else
									delete this.dataSearch.name;
							}
					};

					var model = new ModelAjax(configSearchArchiveFiles);
					var view = new dataModelView(model, $('#archiveFiles'));

					$( ":mobile-pagecontainer" ).pagecontainer( "change", "#archiveFilesPage");
				});

				var a = $('<a data-rel="popup" data-transition="pop" class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-info ui-btn-icon-notext" title="Plus d\'informations" aria-haspopup="true" aria-owns="popupInfo" aria-expanded="false"></a>');
				elt.append(a);

				elt.find('a').on('click',function(event)
				{

					var popup = $('<div id="infoArchive" data-role="popup" class="ui-content ui-popup ui-body-a ui-overlay-shadow ui-corner-all" data-theme="a"></div>');
					var sentence = $('<p></p>');

					sentence.html("name : "+data.name+"<br/>"
					+"uuid : "+data.uuid+"<br/>"
					+"date de création : "+data.volumes[0].starttime.date+"<br/>"
					+"date de fin : "+data.volumes[data.volumes.length-1].endtime.date+"<br/>"
					+"size : "+convertSize(data.size)+"<br/>"
					+"owner : <span class=\"owner\">" + data.owner + "</span><br/>"
					+"creator :  <span class=\"creator\">" + data.creator + "</span><br/>"
					+"metadata : "+data.metadata+"<br/>"
					+"canappend : "+data.canappend+"<br/>"
					+"deleted : "+data.deleted+"<br/>");

					var creator = sentence.find('.creator');
					var owner = sentence.find('.owner');

					$.ajax({
						type : "GET",
						context : this,
						url : "http://taiko/storiqone-backend-my/api/v1/user/",
						data : {
							id : data.creator
						},
						success : function(response) {
							creator.text(response.user.login);
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
						}
					});

					$.ajax({
						type : "GET",
						context : this,
						url : "http://taiko/storiqone-backend-my/api/v1/user/",
						data : {
							id : data.owner
						},
						success : function(response) {
							owner.text(response.user.login);
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
						}
					});

					popup.append(sentence);
					a.attr('href','#popupInfo'+data.id);
					popup.attr('id','popupInfo'+data.id);


					var tabVolumes = $('<table class="ui-responsive table-stripe table-stroke ui-table ui-content ui-table-reflow" data-mode="reflow" data-role="table">');
					var tableHead = $('<thead><tr/></thead>');
					var tabBody = $('<tbody></tbody>');
					var divButtons = $('<div class="ui-grid-a"></div>');
					var configArchiveInfo = {
						'dataSearch': {
							id : data.id
										},
						'headers': [{
							'name': 'id',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
							}
						}, {
							'name': 'sequence',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
								}
						}, {
							'name': 'size',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(convertSize(data[field]));
								}
						}, {
							'name': 'starttime',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field].date);
							}
						}, {
							'name': 'endtime',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field].date);
							}
						}, {
							'name': 'checktime',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								if (data[field] != null)
									elt.text(data[field].date);
								else
									elt.text("");
							}
						}, {
							'name': 'checksumok',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
								}
						}, {
							'name': 'media',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
								}
						}, {
							'name': 'mediaposition',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
								}
						}/*
						  * bouton
							, {
							'name': 'jobrun',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								if(data[field] != null)
									elt.text(data[field]);
								else
									elt.text("");
								}
						}, {
							'name': 'purged',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								if(data[field] != null)
									elt.text(data[field]);
								else
									elt.text("");
								}
						}*/]
					}

					tabVolumes.append(tableHead);
					tabVolumes.append(tabBody);
					popup.append(tabVolumes);

					var model = new ModelVolume(configArchiveInfo, data);
					var view = new dataModelView(model, popup);

					popup.popup();
					popup.popup("open");
					});
			}
		},{
			'name': 'date de création',
			'sortable': false,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.text(data.volumes[0].starttime.date);
			}
		},{
			'name': 'date de fin',
			'sortable': false,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.text(data.volumes[data.volumes.length-1].endtime.date);
			}
		}, {
			'name': 'size',
			'sortable': false,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.text(convertSize(data[field]));
			}
		}],
		'search': function(input) {
			var text = input.val();
			if (text.length > 0)
				this.dataSearch.name = text;
			else
				delete this.dataSearch.name;
		}
	};

	/*
	 * AUTHENTIFICATION
	 */
	$.ajax({
		type: "GET",
		url: "http://taiko/storiqone-backend-my/api/v1/auth/",
		success: function(reponse){
			$( ":mobile-pagecontainer" ).pagecontainer( "change", "#homePage");

			var model = new ModelAjax(configSearchArchive);
			var view = new dataModelView(model, $('#archive'));

		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			$( ":mobile-pagecontainer" ).pagecontainer( "change", "#pageAuthenfication");
		}
	});

	/*
	 * Bouton VALIDER
	 */
	$('#bValider').on("click", function(evt)
	{
		var log = $('#identifiant').val();
		var pw = $('#mdp').val();
		var apik="727fbb26-cc9a-43b8-a68a-78ca86d9cd31";
		var data = { login : log, password : pw, apikey : '727fbb26-cc9a-43b8-a68a-78ca86d9cd31' };
		var json = JSON.stringify(data);

		$.ajax({
			type: "POST",
			url: "http://taiko/storiqone-backend-my/api/v1/auth/",
			data: json,
			dataType : "json",
			contentType : "application/json",
			success: function(reponse){
				var model = new ModelAjax(configSearchArchive);
				var view = new dataModelView(model, $('#archive'));

				$( ":mobile-pagecontainer" ).pagecontainer( "change", "#homePage");
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				var popup = $('#popup');

				popup.popup();
				popup.popup("open");
				setTimeout(function(){  popup.popup("close"); }, 2000);
			}
		});
		evt.preventDefault();
		return false;
	});

	$('#archiveFiles').find('a').click(function()
	{
		var archiveFilesPage = $('#homePage');
		var table_head = archiveFilesPage.find('thead tr');
		var table_body = archiveFilesPage.find('tbody');
		table_head.empty();
		table_body.empty();


		var model = new ModelAjax(configSearchArchive);
		var view = new dataModelView(model, $('#archive'));
	});
});







/*
 * MODEL
 */

class Model {

	addObserver(o) {
		if (this.observeurs.indexOf(o) == -1)
			this.observeurs.push(o);
		if (this.observeurs.length == 1)
			this.fetch();
	}

	constructor(config) {

		this.observeurs = [];
		this.tabIds = [];
		this.tabResults ={};
		this.total_rows = 0;

		if (!('limit' in config.dataSearch))
			config.dataSearch.limit = 10;
		if (!('offset' in config.dataSearch))
			config.dataSearch.offset = 0;
		this.config = config;
	}

	fetch() {
		for (var j in this.observeurs)
			this.observeurs[j](this.model);
	}

	get getConfig() {
		return this.config;
	}

	get getLimit() {
		return this.config.dataSearch.limit;
	}

	get getOffset() {
		return this.config.dataSearch.offset || 0;
	}

	get getResults() {
		var results = [];
		for (var i = 0, n = this.tabIds.length; i < n; i++)
			results.push(this.tabResults[this.tabIds[i]]);
		return results;
	}

	get getTotalRows() {
		return this.total_rows;
	}

	set setLimit(l) {
		if (this.config.dataSearch.limit != l) {
			this.config.dataSearch.limit = l;
			this.config.dataSearch.offset-= this.config.dataSearch.offset%l;
			if (this.observeurs.length > 0)
				this.fetch();
		}
	}

	set setOffset(o) {
		if (this.config.dataSearch.offset != o) {
			this.config.dataSearch.offset = o;
			if(this.observeurs.length > 0)
				this.fetch();
		}
	}

	removeObserver(o) {
		var index = observers.indexOf(o);
		if (index > -1)
			this.observeurs.splice(o,1)
	}

	update() {
		if (this.observeurs.length > 0)
			this.fetch();
	}
}

class ModelAjax extends Model{

	fetch() {
		$.ajax({
			type : "GET",
			context: this,
			url : this.config.url,
			data : this.config.dataSearch,
			success : function(response) {
				this.total_rows = response.total_rows;

				this.tabIds = response[this.config.keySearch];
				var got = 0;
				for (var i = 0, n = this.tabIds.length; i < n; i++) {
					if (this.tabIds[i] in this.tabResults) {
						got++;
						if (got == n)
							for (var j in this.observeurs)
								this.observeurs[j](this);
						continue;
					}

					$.ajax({
						type : "GET",
						context: this,
						url : this.config.url,
						data : {
							id : this.tabIds[i]
						},
						success : function(response) {
							var obj = response[this.config.keyData];
							this.tabResults[obj.id] = obj;
							got++;

							if (got == n)
								for (var j in this.observeurs)
									this.observeurs[j](this.model);
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
							this.tabIds = [];
							this.total_rows = 0;
							for (var j in this.observeurs)
								this.observeurs[j](this);
						}
					});
				}
			}
		});
	}
}

class ModelVolume extends Model {
	constructor(config, archive) {
		super(config);
		this.archive = archive;

		this.total_rows = archive.volumes.length;

		for (var i = 0, n = this.total_rows; i < n; i++) {
			if (i < config.dataSearch.limit)
				this.tabIds[i] = archive.volumes[i]['id'];

			this.tabResults[archive.volumes[i]['id']] = archive.volumes[i];
		}
	}
}

/*function Model(config)
{
	var model = this;
	var observeurs = [];
	var tabIds = [];
	var tabResults = {};
	var totalRows = 0;

	if (!('limit' in config.dataSearch))
		config.dataSearch.limit = 10;
	if (!('offset' in config.dataSearch))
		config.dataSearch.offset = 0;

	this.addObserver = function(o)
	{
		if(observeurs.indexOf(o) == -1)
			observeurs.push(o);
		if (observeurs.length == 1)
			fetch();
	}

	function fetch()
	{
		$.ajax(
		{
			type : "GET",
			url : config.url,
			data : config.dataSearch,
			success : function(response)
			{
				totalRows = response.total_rows;

				if(response[config.keySearch] instanceof Array) {
					tabIds = response[config.keySearch];
					var got = 0;
					for(var i = 0, n = tabIds.length; i < n; i++)
					{
						if (tabIds[i] in tabResults) {
							got++;
							if (got == n)
								for (var j in observeurs)
									observeurs[j](model);
							continue;
						}

						$.ajax(
						{
							type : "GET",
							url : config.url,
							data :
							{
								id : tabIds[i]
							},
							success : function(response)
							{
								var obj = response[config.keyData];
								tabResults[obj.id] = obj;
								got++;

								if (got == n)
									for (var j in observeurs)
										observeurs[j](model);
							}

						});
					}
				}
				else {
					for (var i = 0, n = response.archive.volumes.length; i < n; i++)
						tabIds[i] = response.archive.volumes[i].id;
					for (var i = 0, n = tabIds.length; i < n; i++) {
						var obj = response.archive.volumes[i];
						tabResults[obj.id] = obj;
					}
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				tabIds = [];
				totalRows = 0;
				for (var j in observeurs)
					observeurs[j](model);
			}
		});
	}

	this.getConfig = function()
	{
		return config;
	}

	this.getLimit = function()
	{
		return config.dataSearch.limit;
	}

	this.getOffset = function()
	{
		return config.dataSearch.offset || 0;
	}

	this.getResults = function()
	{
		var results = [];
		for (var i = 0, n = tabIds.length; i < n; i++)
			results.push(tabResults[tabIds[i]]);
		return results;
	}

	this.getTotalRows = function()
	{
		return totalRows;
	}

	this.setLimit = function(l)
	{
		if(config.dataSearch.limit != l)
		{
			config.dataSearch.limit = l;
			config.dataSearch.offset-= config.dataSearch.offset%l;
			if(observeurs.length > 0)
				fetch();
		}
	}

	this.setOffset = function(o)
	{
		if(config.dataSearch.offset != o)
		{
			config.dataSearch.offset = o;
			if(observeurs.length > 0)
				fetch();
		}
	}

	this.removeObserver = function(o)
	{
		var index = observers.indexOf(o);
		if (index > -1)
			observeurs.splice(o, 1);
	}

	this.update = function() {
		if (observeurs.length > 0)
			fetch();
	}
}*/

/*
 * VUE
 */
function dataModelView(model, elt)
{
	var config = model.getConfig;

	elt.data('model', model);
	elt.data('view', this);

	var search = elt.find('.search');

	var delaySearch = null;

	function searchDelayed() {
		if (delaySearch)
			clearTimeout(delaySearch);
		delaySearch = setTimeout(searchNow, 1000);
	//	delaySearch = setTimeout(searchNow);
	}

	function searchNow() {
		if (delaySearch)
			clearTimeout(delaySearch);
		delaySearch = null;
		var url = config.url;

		config.url+="/search"
		config.search(search);
		config.dataSearch.offset = 0;
		model.update();
		config.url = url;
	}

	function searchInput(evt) {
		if (evt.which == 13)
			searchNow();
		else
			searchDelayed();
	}

	search.on('change', searchNow);
	search.on('keypress', searchInput);
	search.on('delete', function() {
		search.off();
	});

	var table = elt.find('table');
	var table_head = table.find('thead tr');
	var table_body = table.find('tbody');
	var lButtons = elt.find('.bTransitions');

	function sort(name) {
		return function() {
			if (config.dataSearch.order_by == name)
				config.dataSearch.order_asc = 'order_asc' in config.dataSearch ? !config.dataSearch.order_asc : false;
			else
				config.dataSearch.order_by = name;
			model.update();
		};
	}

	for (var i = 0, n = config.headers.length; i < n; i++) {
		var th = $('<th />');
		th.text(config.headers[i].name);
		if (config.headers[i].sortable)
			th.on('click', sort(config.headers[i].name));
		table_head.append(th);
	}
	//table.table('rebuild');

	function display() {
		table_body.empty();
		var results = model.getResults;
		for (var i = 0, n = results.length; i < n; i++) {
			var row = $('<tr />');
			row.data('data', results[i]);

			for (var j = 0, m = config.headers.length; j < m; j++) {
				var td = $('<td/>');
				if (config.headers[j].transform)
					config.headers[j].transform(td, config.headers[j].name, results[i]);
				else
					td.text(results[i][config.headers[j].name]);
				row.append(td);
			}
			table_body.append(row);
		}
		//table.table('rebuild');
		bTransitions();
	}
	model.addObserver(display);

	function bTransitions() {
		lButtons.empty();

		var limit = model.getLimit;
		var offset = model.getOffset;
		var bFirst = $('<a class="ui-btn ui-corner-all ui-icon-arrow-u-l ui-btn-icon-bottom"></a>');
		var bPrevious = $('<a class="ui-btn ui-corner-all ui-icon-arrow-l ui-btn-icon-bottom"></a>');
		var bNext = $('<a class="ui-btn ui-corner-all ui-icon-arrow-r ui-btn-icon-bottom"></a>');
		var bLast = $('<a class="ui-btn ui-corner-all ui-icon-arrow-d-r ui-btn-icon-bottom"></a>');

		lButtons.append(bFirst);
		lButtons.append(bPrevious);
		lButtons.append(bNext);
		lButtons.append(bLast);

		var total_rows = model.getTotalRows;


		var current_page = offset / limit;
		var page_count = total_rows / limit;
		if (offset == 0) {
			bFirst.addClass('disabled');
			bPrevious.addClass('disabled');
		}
		else {
			bFirst.on('click', go(0));
			bPrevious.on('click',go(offset - limit));
		}

		if (offset + limit >= total_rows) {
			bNext.addClass('disabled');
			bLast.addClass('disabled');
		}
		else {
			bNext.on('click', go(offset + limit));
			if(total_rows % limit == 0) {
				bLast.on('click', go(total_rows - limit));
			}
			else
				bLast.on('click', go(total_rows - total_rows % limit));
		}

		for(i = current_page - 3; i < current_page + 4 && i < page_count; i++) {
			if (i < 0)
				continue;
			var numPage = $('<a class="ui-btn ui-corner-all"></a>');
			numPage.html(i+1);
			if (offset == i * limit)
				numPage.addClass('disabled');
			else
				numPage.on('click',go(i * limit));

			bNext.before(numPage);
		}

		var informations = elt.find('.infoLines');
		var text = "";
		if(total_rows == 0)
			text = "Ligne " +(offset)+ " à "+Math.min(offset+limit,total_rows)+" sur "+total_rows+" lignes";
		else
			text = "Ligne " +(offset+1)+ " à "+Math.min(offset+limit,total_rows)+" sur "+total_rows+" lignes";
		informations.text(text);

	}

	function go(new_index) {
		return function() {
			model.setOffset = new_index;
		};
	}

	var limit = elt.find('#menuLimit');
	if (limit.length > 0) {
		limit.on('click', function() {
			model.setLimit = parseInt(limit.val());
			model.setOffset = 0;
		});
		model.addObserver(function() {
			limit.val(model.getLimit);
			//limit.selectmenu( "refresh" );
		});
	}
}

	/*function listeArchives() {
		var search = $('#archiveTable tbody');

		search.empty();

		$.ajax(
		{
			type : "GET",
			url : "http://taiko/storiqone-backend-my/api/v1/archive",
			success : function(reponse)
			{
				for(i=0;i<reponse.archives.length;i++)
				{
					$.ajax(
					{
						type : "GET",
						url : "http://taiko/storiqone-backend-my/api/v1/archive/",
						data :
						{
							id : reponse.archives[i]
						},
						success : function(rep)
						{
							$('#archiveTable thead').removeClass('ui-screen-hidden');
							search.removeClass('ui-screen-hidden');
							var ligne=$('<tr class="ui-screen-hidden"></tr>');
							var name=$('<td></td>');
							var dateCreation=$('<td></td>');
							var dateFin=$('<td></td>');
							var taille=$('<td></td>');
							var pool=$('<td></td>');
							var dernierElement = rep.archive.volumes.length-1;


							var a = $('<a data-rel="popup" data-transition="pop" class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-info ui-btn-icon-notext" title="Plus d\'informations" aria-haspopup="true" aria-owns="popupInfo" aria-expanded="false"></a>');
							//a.attr('href','#popupInfo'+rep.archive.id);
							//console.log(a.attr('href'));
							name.text(rep.archive.name);
							name.append(a);
							var popup = $('<div data-role="popup" class="ui-content ui-popup ui-body-a ui-overlay-shadow ui-corner-all" data-theme="a"></div>');
							//popup.attr('id','popupInfo'+rep.archive.id);
							//console.log(popup.attr('id'));
							popup.popup();
							var phrase = $('<p></p>');*/

							/*
							 * Files
							 */
				/*			for(j=0;j<rep.archive.volumes.length;j++)
							{
								$.ajax(
								{
									type : "GET",
									url : "http://taiko/storiqone-backend-my/api/v1/archivefile/",
									data :
									{
										id : rep.archive.volumes[j].id
									},
									success : function(repFile)
									{
										a.attr('href','#popupInfo'+rep.archive.id+repFile.archivefile.id);
										popup.attr('id','popupInfo'+rep.archive.id+repFile.archivefile.id);
										if(phrase.text().length>0)
											phrase.html(phrase.text()+"<br/>"+repFile.archivefile.name);
										else
											phrase.text(repFile.archivefile.name);
										//console.log(repFile);
										//console.log(phrase.text());
									}
								});
							}

							//console.log(phrase.text());
							console.log(rep);
							popup.append(phrase);

							dateCreation.text(rep.archive.volumes[0].starttime.date);
							dateFin.text(rep.archive.volumes[dernierElement].endtime.date);
							taille.text(convertSize(rep.archive.size));
							$.ajax(
							{
								type : "GET",
								url : "http://taiko/storiqone-backend-my/api/v1/media",
								data :
								{
									id : rep.archive.volumes[0].media
								},
								success : function(reponse)
								{
								pool.text(reponse.media.pool.name);
								}
							});
							ligne.append(name);
							ligne.append(dateCreation);
							ligne.append(dateFin);
							ligne.append(taille);
							ligne.append(pool);
							search.append(ligne);
						},
					});
				}
			}
		});
	}*/


function convertSize(size)
{
	if (typeof size == "string")
	size = parseInt(size);
/*
 * Conversion des tailles
 */
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




