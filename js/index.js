$(document).ready(function()
{
/*	// Research archive's configuration
	var configSearchArchive = {
		'url': 'http://taiko/storiqone-backend-my/api/v1/archive',
		'keyData': 'archive',
		'keySearch': 'archives',
		'dataSearch': {},
		'headers': [{
			// Archive's name
			'name': 'name',
			'sortable': true,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.append('<p>'+data.name+'</p>');

				// Event listener when we click on Archive's name
				// It allows opening Archive Files's page
				$(elt).find('p').on('click',function()
				{
					// Archive Files's page
					// Create Archive Files table
					var archiveFilesPage = $('#archiveFilesPage');
					var tableHeadArchiveFiles = archiveFilesPage.find('thead tr');
					var tableBodyArchiveFiles = archiveFilesPage.find('tbody');

					// Research Archive Files's configuration
					var configSearchArchiveFiles = {
						'url': 'http://taiko/storiqone-backend-my/api/v1/archivefile',
						'keyData': 'archivefile',
						'keySearch': 'archivefiles',
						'dataSearch': {
							// Provide an archive's ID to get its files's information
							archive : data.id
						},
						// File's name
						'headers': [{
							'name': 'name',
							'sortable': true,
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data.name);
								}
							}, {
								// File's size by byte
								'name': 'size',
								'sortable': false,
								'translatable': true,
								'transform': function(elt, field, data) {
									elt.text(convertSize(data[field]));
								}
							}],
							// Search filter bar
							'search': function(input) {
								var text = input.val();

								if (text.length > 0)
									this.dataSearch.name = text;
								else
									delete this.dataSearch.name;
							}
					};

					// Clear Archive Files table's head and body for each research
					tableHeadArchiveFiles.empty();
					tableBodyArchiveFiles.empty();

					// Create a model and a view for Archive Files's table
					var archiveFilesModel = new ModelAjax(configSearchArchiveFiles);
					var archiveFilesView = new dataModelView(archiveFilesModel, $('#archiveFiles'));

					// Change to Archive Files's page
					$( ":mobile-pagecontainer" ).pagecontainer( "change", "#archiveFilesPage");
				});

				// "More informations" button next to archive's name for more informations
				var archiveInfoButton = $('<a data-rel="popup" data-transition="pop" class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-info ui-btn-icon-notext" title="More informations" aria-haspopup="true" aria-owns="popupInfo" aria-expanded="false"></a>');

				// Add Archive Info button
				elt.append(archiveInfoButton);

				// Event listener when we click on "More informations" button
				// Create a pop-up to show Archive's informations in detail
				elt.find('a').on('click',function(event)
				{
					// Archive's information pop-up
					var archiveInfoPopup = $('<div id="infoArchive" data-role="popup" class="ui-content ui-popup ui-body-a ui-overlay-shadow ui-corner-all" data-theme="a"></div>');
					// Close button
					var archiveInfoCloseButton = $('<a data-rel="back" class="ui-btn ui-btn-a ui-btn-icon-notext ui-btn-right  ui-corner-all ui-icon-delete ui-shadow ">Close</a>');
					// Archive's information in detail
					var archiveInfo = $('<p></p>');

					archiveInfoPopup.append(archiveInfoCloseButton);
					archiveInfo.html("name : "+data.name+"<br/>"
					+"uuid : "+data.uuid+"<br/>"
					+"date de création : "+data.volumes[0].starttime.date+"<br/>"
					+"date de fin : "+data.volumes[data.volumes.length-1].endtime.date+"<br/>"
					+"size : "+convertSize(data.size)+"<br/>"
					+"owner : <span class=\"owner\">" + data.owner + "</span><br/>"
					+"creator :  <span class=\"creator\">" + data.creator + "</span><br/>"
					+"metadata : "+data.metadata+"<br/>"
					+"canappend : "+data.canappend+"<br/>"
					+"deleted : "+data.deleted+"<br/>");
					var archiveInfo = $('<ul data-role="listview"></ul>');
					archiveInfo.append("<li><b>name</b> : "+data.name+"</li>");
					archiveInfo.append("<li><b>uuid</b> : "+data.uuid+"</li>");
					archiveInfo.append("<li><b>starttime</b> : "+data.volumes[0].starttime.date+"</li>");
					archiveInfo.append("<li><b>endtime</b> : "+data.volumes[data.volumes.length-1].endtime.date+"</li>");
					archiveInfo.append("<li><b>size</b> : "+convertSize(data.size)+"</li>");
					archiveInfo.append("<li><b>owner</b> : <span class=\"owner\"></span></li>");
					archiveInfo.append("<li><b>creator</b> : <span class=\"creator\"></span></li>");
					archiveInfo.append("<li><b>metadata</b> : "+data.metadata+"</li>");
					archiveInfo.append("<li><b>canappend</b> : "+data.canappend+"</li>");
					archiveInfo.append("<li><b>deleted</b> : "+data.deleted+"</li>");
					archiveInfo.css('list-style-type','none');

					archiveInfoPopup.append(archiveInfoCloseButton);

					var creator = archiveInfo.find('.creator');
					var owner = archiveInfo.find('.owner');

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

					archiveInfoPopup.append(archiveInfo);

					// Add a link for the "More informations" button and pop-up
					archiveInfoButton.attr('href','#popupArchiveInfo'+data.id);
					archiveInfoPopup.attr('id','popupArchiveInfo'+data.id);

					// Create "Volumes" table
					var tableVolumes = $('<table class="ui-responsive table-stripe table-stroke ui-table ui-content ui-table-reflow" data-mode="reflow" data-role="table">');
					var tableHeadVolumes = $('<thead><tr/></thead>');
					var tabBodyVolumes = $('<tbody></tbody>');

					// Archive Volumes's configuration
					var configArchiveVolumes = {
						'dataSearch': {
							// Provide an archive file's ID to get its information
							id : data.id
										},
						'headers': [{
							// Volume's ID
							'name': 'id',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
							}
						}, {
							// Volume's sequence
							'name': 'sequence',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
								}
					}, {
							// Volume's size by byte
							'name': 'size',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(convertSize(data[field]));
								}
						}, {
							// Volume's start time
							'name': 'starttime',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field].date);
							}
						}, {
							// Volume's end time
							'name': 'endtime',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field].date);
							}
						}, {
							// Volume's checktime
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
							// Volume's checksum
							'name': 'checksumok',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								elt.text(data[field]);
								}
						}, {
							// Volume's media
							'name': 'media',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {								
								// Create Media's name, pop-up, close button and pop-up's information
								var mediaName = $('<a class=\"media\" class="ui-corner-all ui-shadow" data-rel="popup" data-transition="pop"></a>');

								// Add Media name in Volume's table
								elt.append(mediaName);

								// Get Media's information
								$.ajax({
									type : "GET",
									context : this,
									url : "http://taiko/storiqone-backend-my/api/v1/media/",
									data : {
										// Provide Media's ID to get its information
										id : data[field]
									},
									success : function(response) {
										elt.data('data', response);

										// Write Media's name
										mediaName.text(response[field].label);

										// Event listener when click on Media's name
										// Create a table which contains Media's information
										mediaName.on('click',function() {
											// Archive Files's page
											// Create Archive Files table
											var mediaPage = $('#mediaPage');
											var mediaTableHead = mediaPage.find('thead tr');
											var mediaTableBody = mediaPage.find('tbody');

											// Media's configuration
											var configMedia = {
												'url' : 'http://taiko/storiqone-backend-my/api/v1/media/',
												'keyData' : 'media',
												'keySearch' : 'media',
												'dataSearch' : {
													// Provide a Media's ID to get its information
													id : response[field].id
												},
												'headers' : [{
													// Media's name
													'name' : 'name',
													'sortable' : true,
													'translatable' : true,
													'transform' : function(elt, field, data) {
														elt.text(data[field]);
													}
												}, {
													// Media's label	
													'name' : 'label',
													'sortable' : false,
													'translatable' : true,
													'transform' : function(elt, field, data) {
														elt.text(data[field]);
													}
												}]
											};
											// Create Media's model and view
											var mediaModel = new ModelAjax(configMedia);
											var mediaView = new dataModelView(mediaModel, $('#media'));

											// Change to Archive Files's page
											$( ":mobile-pagecontainer" ).pagecontainer( "change", "#mediaPage");
										});
									},
									error : function(XMLHttpRequest, textStatus, errorThrown) {}
									});
							}
						}, {
							'name': 'mediaposition',
							'sortable': 'false',
							'translatable': true,
							'transform': function(elt, field, data) {
								// Volume's media position
								elt.text(data[field]);
								}
						}
						  * button for jobrun and purged
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
						}
						]};
					
					// Add head and body in Volumes Table
					tableVolumes.append(tableHeadVolumes);
					tableVolumes.append(tabBodyVolumes);
					archiveInfoPopup.append(tableVolumes);

					// Create Volume's model and view
					var volumesModel = new ModelVolume(configArchiveVolumes, data);
					var volumesView = new dataModelView(volumesModel, archiveInfoPopup);

					// Autoinitialize pop-up
					archiveInfoPopup.popup();
					// Open Archive pop-up
					archiveInfoPopup.popup("open");
					// Event listener Archive pop-up's after close, it destroys itself 
					archiveInfoPopup.on("popupafterclose", function(event) {
						archiveInfoPopup.popup("destroy");
					});
				});
			}
		},{
			// Archive's start time
			'name': 'starttime',
			'sortable': false,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.text(data.volumes[0].starttime.date);
			}
		},{
			// Archive's end time
			'name': 'endtime',
			'sortable': false,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.text(data.volumes[data.volumes.length-1].endtime.date);
			}
		}, {
			// Archive's size by byte
			'name': 'size',
			'sortable': false,
			'translatable': true,
			'transform': function(elt, field, data) {
				elt.text(convertSize(data[field]));
			}
		}],
		// Archive Search filter bar
		'search': function(input) {
			var text = input.val();

			if (text.length > 0)
				this.dataSearch.name = text;
			else
				delete this.dataSearch.name;
		}
	};
*/









	// Archive's configuration
	var archiveConfig = {
		'url': 'http://taiko/storiqone-backend-my/api/v1/archive',
		'keyData': 'archive',
		'keySearch': 'archives',
		'dataSearch': {},
		'informations': {
			'title' : 'name',
			'template': 'template/archive.html',
			'transform': function(elt, data) {
				elt.find('#uuid').text(data.uuid);	
				elt.find('#starttime').text(data.volumes[0].starttime.date);
				elt.find('#endtime').text(data.volumes[data.volumes.length-1].endtime.date);
				elt.find('#size').text(convertSize(data.size));
				elt.find('#metadata').text(data.metadata);
				elt.find('#canappend').text(data.canappend);
				elt.find('#deleted').text(data.deleted);

				var creator = elt.find('#creator');
				var owner = elt.find('#owner');

				// Get informations from creator
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

				// Get informations from owner
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

				// Archive Volumes's configuration
				var configArchiveVolumes = {
					'dataSearch': {
						// Provide an archive file's ID to get its information
						id : data.id
									},
					'headers': [{
						// Volume's ID
						'name': 'id',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							elt.text(data[field]);
						}
					}, {
						// Volume's sequence
						'name': 'sequence',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							elt.text(data[field]);
							}
					}, {
						// Volume's size by byte
						'name': 'size',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							elt.text(convertSize(data[field]));
							}
					}, {
						// Volume's start time
						'name': 'starttime',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							elt.text(data[field].date);
						}
					}, {
						// Volume's end time
						'name': 'endtime',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							elt.text(data[field].date);
						}
					}, {
						// Volume's checktime
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
						// Volume's checksum
						'name': 'checksumok',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							elt.text(data[field]);
							}
					}, {
						// Volume's media
						'name': 'media',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {								
							elt.text(data[field]);
						/*	// Create Media's name, pop-up, close button and pop-up's information
							var mediaName = $('<a class=\"media\" class="ui-corner-all ui-shadow" data-rel="popup" data-transition="pop"></a>');

							// Add Media name in Volume's table
							elt.append(mediaName);

							// Get Media's information
							$.ajax({
								type : "GET",
								context : this,
								url : "http://taiko/storiqone-backend-my/api/v1/media/",
								data : {
									// Provide Media's ID to get its information
									id : data[field]
								},
								success : function(response) {
									elt.data('data', response);

									// Write Media's name
									mediaName.text(response[field].label);

									// Event listener when click on Media's name
									// Create a table which contains Media's information
									mediaName.on('click',function() {
										// Archive Files's page
										// Create Archive Files table
										var mediaPage = $('#mediaPage');
										var mediaTableHead = mediaPage.find('thead tr');
										var mediaTableBody = mediaPage.find('tbody');

										// Media's configuration
										var configMedia = {
											'url' : 'http://taiko/storiqone-backend-my/api/v1/media/',
											'keyData' : 'media',
											'keySearch' : 'media',
											'dataSearch' : {
												// Provide a Media's ID to get its information
												id : response[field].id
											},
											'headers' : [{
												// Media's name
												'name' : 'name',
												'sortable' : true,
												'translatable' : true,
												'transform' : function(elt, field, data) {
													elt.text(data[field]);
												}
											}, {
												// Media's label	
												'name' : 'label',
												'sortable' : false,
												'translatable' : true,
												'transform' : function(elt, field, data) {
													elt.text(data[field]);
												}
											}]
										};
										// Create Media's model and view
										var mediaModel = new ModelAjax(configMedia);
										var mediaView = new dataModelView(mediaModel, $('#media'));

										// Change to Archive Files's page
										$( ":mobile-pagecontainer" ).pagecontainer( "change", "#mediaPage");
									});
								},
								error : function(XMLHttpRequest, textStatus, errorThrown) {}
								});*/
						}
					}, {
						'name': 'mediaposition',
						'sortable': 'false',
						'translatable': true,
						'transform': function(elt, field, data) {
							// Volume's media position
							elt.text(data[field]);
							}
					}/*
					  * button for jobrun and purged
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
					}*/
				]};
				
				var volumeTab = elt.find('#volume').parent();
				
				// Create Volume's model and view
				var volumeModel = new ModelVolume(configArchiveVolumes, data);
				var volumeView = new dataModelView(volumeModel, volumeTab);


			} // End function transform

		}, // End informations
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

			var model = new ModelAjax(archiveConfig);
			var view = new listView(model, $('#archiveList'));
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			$( ":mobile-pagecontainer" ).pagecontainer( "change", "#authentificationPage");
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
		
			var model = new ModelAjax(archiveConfig);
			var view = new listView(model, $('#archiveList'));

				$( ":mobile-pagecontainer" ).pagecontainer( "change", "#archivePage");
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


function listView(model, elt) {
	var paginationButton = elt.parent().find('.paginationButton');
	
	// Configuration
	var config = model.getConfig;

	// More informations for developers
	elt.data('model', model);
	elt.data('view', this);

	// Research
	var search = elt.parent().find('.search');
	var delaySearch = null;

	function searchDelayed() {
		if (delaySearch)
			clearTimeout(delaySearch);
		delaySearch = setTimeout(searchNow, 1000);
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

	function sort(name) {
		return function() {
			if (config.dataSearch.order_by == name)
				config.dataSearch.order_asc = 'order_asc' in config.dataSearch ? !config.dataSearch.order_asc : false;
			else
				config.dataSearch.order_by = name;
			model.update();
		};
	}

	// Collapsible set Listview
	var collapsibleSet = elt;


	// Create collapsible and list view
	function display() {
		// Erase all items to update everytime
		collapsibleSet.empty();

		// Get results from model
		var results = model.getResults;

		// Create an item and its name after each iteration
		for (var i = 0, n = results.length; i < n; i++) {
			var item = $('<div data-role="collapsible"></div>');

			var title = $('<h2 class="ui-collapsible-heading"></h2>');
			var a = $('<a class="ui-collapsible-heading-toggle ui-btn ui-btn-icon-left ui-btn-a ui-icon-plus">' + results[i][config.informations.title] + '</a>');

			// If element is already existed, it will be hided or showed
			title.on('click', {'item': item, 'loaded': false, 'result': results[i]}, function(evt) {
				$(evt.target).toggleClass('ui-icon-plus ui-icon-minus');

				if (evt.data.loaded) {
					evt.data.item.children().eq(1).finish().slideToggle(500);
					return;
				} // End if

				evt.data.loaded = true;
				$.ajax({
					'url': config.informations.template,
					'success': function(childNode) {
						evt.data.item.append(childNode);
						config.informations.transform(evt.data.item, evt.data.result);
					} // End function
				}); // End ajax
			}); // End event listener

			title.append(a);
			item.append(title);

			collapsibleSet.append(item);
		} // End loop
		pagination();
	} // End function display

	model.addObserver(display);

	// Page to another page with buttons
	function pagination() {
		// Update everytime
		paginationButton.empty();

		var limit = model.getLimit;
		var offset = model.getOffset;
		var totalRows = model.getTotalRows;

		// Buttons for the pagination
		var firstButton = $('<a class="ui-btn ui-corner-all ui-icon-arrow-u-l ui-btn-icon-bottom"></a>');
		var previousButton = $('<a class="ui-btn ui-corner-all ui-icon-arrow-l ui-btn-icon-bottom"></a>');
		var nextButton = $('<a class="ui-btn ui-corner-all ui-icon-arrow-r ui-btn-icon-bottom"></a>');
		var lastButton = $('<a class="ui-btn ui-corner-all ui-icon-arrow-d-r ui-btn-icon-bottom"></a>');

		var currentPage = offset / limit;
		var pageCount = totalRows / limit;

		// Add all buttons
		paginationButton.append(firstButton);
		paginationButton.append(previousButton);
		paginationButton.append(nextButton);
		paginationButton.append(lastButton);

		// Disable the "first" and "previous" buttons
		if (offset == 0) {
			firstButton.addClass('disabled');
			previousButton.addClass('disabled');
		} // End if

		else {
			firstButton.on('click', go(0));
			previousButton.on('click', go(offset - limit));
		} // End else

		// Disabled the "next" and "last" buttons
		if (offset + limit >= totalRows) {
			nextButton.addClass('disabled');
			lastButton.addClass('disabled');
		} // End if

		else {
			nextButton.on('click', go(offset + limit));

			if (totalRows % limit == 0)
				lastButton.on('click', go(totalRows - limit));

			else
				lastButton.on('click', go(totalRows - totalRows % limit));
		} //End else

		for (i = currentPage - 3; i < currentPage + 4 && i < pageCount; i++) {
			if (i < 0)
				continue;
			
			var pageNumber = $('<a class="ui-btn ui-corner-all"></a>');

			pageNumber.text(i+1);
			
			if (offset == i * limit) 
				pageNumber.addClass('disabled');	

			else
				pageNumber.on('click', go(i * limit));

			nextButton.before(pageNumber);
		} // End loop

		// Informations about rows
		var informations = elt.parent().find('.infoLines');
		var text = "";
		if(totalRows == 0)
			text = "Ligne " + offset + " à " + Math.min(offset + limit, totalRows)+" sur "+totalRows +" lignes";
		else
			text = "Ligne " + (offset + 1) + " à "+Math.min(offset + limit, totalRows)+" sur "+totalRows+" lignes";
		informations.text(text);

	} // End function paginationButton
	
	// Allows paging
	function go(newIndex) {
		return function() {
			model.setOffset = newIndex;
		}
	} // End function go

	// Limit from list
	var limit = elt.parent().find('#menuLimit');

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




