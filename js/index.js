var config = null;
var validateSession = null; 
$.ajax({
	type: "GET",
	url: "config.json",
	success: function(response) {
		config = response;
		$(main);
	}
});

function main() {
	$("[data-role=panel]").enhanceWithin().panel(); //Initialize panel function

	$( ":mobile-pagecontainer" ).on( "pagecontainerchange", function(event, ui) { //wipe values entered in the inputs of the edit form when left
		if (location.hash == "#administrationPage")
		{
			$('#login').val('');
			$('#fullname').val('');
			$('#pwd').val('');
			$('#email').val('');
			$('#homedir').val('');
			$("#canadmin").prop("checked",false).checkboxradio().checkboxradio("refresh");
			$("#canarchive").prop("checked",false).checkboxradio().checkboxradio("refresh");
			$("#canrestore").prop("checked",false).checkboxradio().checkboxradio("refresh");
			$("#disabled").prop("checked",false).checkboxradio().checkboxradio("refresh");
			$('[name="poolgroup"]').val('').selectmenu().selectmenu('refresh', true);
			$('#editButton').off('click');
		}	
	});

	// Archive's configuration
	var archiveConfig = {
		'url': config["api url"]+"/api/v1/archive/",
		'keyData': 'archive',
		'keySearch': 'archives',
		'dataSearch': {},
		'informations': {
			'title' : 'name',
			'template': 'template/archive.html',
			'transform': function(elt, data) {
				$.ajax({ //Access rights for users
					type : "GET",
					dataType : "json",
					url : config["api url"]+"/api/v1/auth/",
					success : function(response) {
						$.ajax({
							type : "GET",
							dataType : "json",
							url : config["api url"]+"/api/v1/user/?id="+response.user_id,
							success : function(response) {
								if (response.user.canrestore) elt.find('#RestoreButton').show('fast'); //remove the attribute CSS display:none if the user can restore
								if (!response.user.isadmin) $('#adminPage').hide(); //hide the administration page tab if the user is not an admin

							},
							error: function(XMLHttpRequest, textStatus, errorThrown) {
							},

						});
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
					},

				});
				elt.data('data', data);
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
					url : config["api url"]+"/api/v1/user/",
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
					url : config["api url"]+"/api/v1/user/",
					data : {
						id : data.owner
					},
					success : function(response) {
						owner.text(response.user.login);
					},
					error : function(XMLHttpRequest, textStatus, errorThrown) {
					}
				});

				// Archive Volumes' configuration
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
						//	elt.text(data[field]);
							// Create Media's name, pop-up, close button and pop-up's information
							var mediaName = $('<a href="#mediaPage" class="ui-btn ui-shadow ui-corner-all"></a>');
							$.ajax({
								type : "GET",
								context : this,
								url : config["api url"]+"/api/v1/media/",
								data : {
									id : data.media
								},
								success : function(response) {
									mediaName.text(response.media.name);
									mediaName.on('click', function() {
										$('#media .search').val(response.media.name);
										$('#media .search').trigger('change');
									});
								},
								error : function(XMLHttpRequest, textStatus, errorThrown) {
								}
							});
							// Add Media name in Volume's table
							elt.append(mediaName);
							// Media's configuration
							var mediaConfig = {
								'url' : config["api url"]+"/api/v1/media/",
								'keyData' : 'media',
								'keySearch' : 'medias',
								'dataSearch' : {
									// Provide a Media's ID to get its information
								//	id : data.media
								}, // End dataSearch
								'informations' : {
									'title' : 'name',
									'template' : 'template/media.html',
									'transform' : function(elt, data) {
										elt.find('#name').text(data.name);
										elt.find('#label').text(data.label);
										elt.find('#pool').text(data.pool.name);
										elt.find('#format').text(data.mediaformat.name);
										elt.find('#uuid').text(data.uuid);
										elt.find('#firstused').text(data.firstused.date);
										elt.find('#usebefore').text(data.usebefore.date);

										var espace_used = elt.find('#spaceused');
										espace_used.find('meter').attr('min',0);
										espace_used.find('meter').attr('max',data.totalblock * data.blocksize);
										espace_used.find('meter').attr('value',(data.totalblock * data.blocksize) - (data.blocksize * data.freeblock));
										espace_used.find('label').text(convertSize((data.totalblock * data.blocksize) - (data.blocksize * data.freeblock))+"/"+convertSize(data.totalblock * data.blocksize));
										espace_used.find('label').css('text-align','center');
									}, // End transform
								}, // End informations
								'search': function(input) {
									var text = input.val();

									if (text.length > 0)
										this.dataSearch.name = text;
									else
										delete this.dataSearch.name;
								}
							}; // End mediaConfig

							// Create Media's model and view
							var mediaModel = new ModelAjax(mediaConfig);
							var mediaView = new listView(mediaModel, $('#mediaList'));
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
				]};
				
				var volumeTab = elt.find('#volume').parent();
				
				// Create Volume's model and view
				var volumeModel = new ModelVolume(configArchiveVolumes, data);
				var volumeView = new dataModelView(volumeModel, volumeTab);

				// Event listener when clicked, change to archive's files page
				elt.find('#archiveFilesButton a').on('click', function() {
					// Research Archive Files's configuration
					var configSearchArchiveFiles = {
						'url': config["api url"]+"/api/v1/archivefile/",
						'keyData': 'archivefile',
						'keySearch': 'archivefiles',
						'dataSearch': {
							// Provide an archive's ID to get its files's information
							archive : data.id
						},
						'informations': {
							'title' : 'name',
							'template' : 'template/archiveFiles.html',
							'transform' : function(elt, data) {
								elt.find('#name').text(data.name);
								elt.find('#mimetype').text(data.mimetype);
								elt.find('#owner').text(data.owner);
								elt.find('#groups').text(data.groups);
								elt.find('#ctime').text(data.ctime);
								elt.find('#mtime').text(data.mtime);
								elt.find('#size').text(convertSize(data.size));
								elt.find('#media').text(data.medias);

								var metadata = elt.find('#metadata');
								$.ajax({
									type : "GET",
									context : this,
									url : config["api url"]+"/api/v1/archivefile/metadata/",
									data : {
										id : data.id
									},
									success : function(response) {
										var meta = "{";
										Object.keys(response.metadata).forEach(function (key) {
											meta = meta + '"' + key + '" : ';
											if((response.metadata[key]).constructor === Object){
												var meta1 = "{";
												Object.keys(response.metadata[key]).forEach(function (key2) {
													meta1 = meta1 + '"'+ key2 + '" : "' + (response.metadata[key])[key2] + '"';
												});
												meta1 = meta1 + "}";
												meta = meta + meta1;
											}
											else
												meta = meta + '"'+ response.metadata[key]+'"';
											meta = meta + ' , ';
										});
										meta = meta + "}";
										metadata.text(meta);
									},
									error : function(XMLHttpRequest, textStatus, errorThrown) {
										metadata.text("No metadata found for this object");
									}
								});
								$.ajax({
									type : "GET",
									context : this,
									url : config["api url"]+"/api/v1/archive/",
									data : {
										id : data.archive
									},
									success : function(response) {
										elt.find('#archivePage a').text(response.archive.name);
										$('#archivePage a').on('click', function() {
											$('#archive .search').val(response.archive.name);
											$('#archive .search').trigger('change');
										});
									},
									error : function(XMLHttpRequest, textStatus, errorThrown) {
									}
								});
							}
						}, // End function transform
						// Search filter bar
						'search': function(input) {
							var text = input.val();

							if (text.length > 0)
								this.dataSearch.name = text;
							else
								delete this.dataSearch.name;
						} // End search
					}; // End archive's files configuration

					// Create a model and a view for Archive Files's list
					var archiveFilesModel = new ModelAjax(configSearchArchiveFiles);
					var archiveFilesView = new listView(archiveFilesModel, $('#archiveFilesList'));

				}); // End event listener

				
				elt.find('#RestoreButton a').on('click', function() {

					$.ajax({
						type : "POST", //Restoration task is triggered with a POST request
						url : config["api url"]+"/api/v1/archive/restore/",
						contentType : "application/json",
						dataType: 'json',
						data : JSON.stringify({
							archive : data.id,
							nextstart: "now",
							destination: config["restore path"]
						}),
						success : function(response) {
							$.mobile.changePage(config["simple-ui url"]+"/dialog/rSuccess.html", { role: "dialog" } );

						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
							$.mobile.changePage(config["simple-ui url"]+"/dialog/rFailed.html", { role: "dialog" } );
						}
					});
				});
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
	 * authentification
	 * login and password to log in
	 */
	$.ajax({
		type: "GET", 
		url: config["api url"]+"/api/v1/auth/", 
		success: function(response) {
			// create model and view for "archive page" after login
			var model = new ModelAjax(archiveConfig);
			var view = new listView(model, $('#archiveList'));

			// Change to archive page
			$( ":mobile-pagecontainer" ).pagecontainer( "change", "#archivePage");
		}, // end success
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			$( ":mobile-pagecontainer" ).pagecontainer( "change", "#authentification_page");
		} // end error
	}); // end ajax

	/*
	 * log in button
	 * if login and password are valid
	 * change to archive page
	 * else, show popup
	 */
	$('#log_in_button').on("click", function(evt)

	{
		var log = $('#identifiant').val();
		var pw = $('#password').val();
		var authdata = {
			login : log,
			password : pw,
			apikey : config["apikey"]
		};
		var authjson = JSON.stringify(authdata);

		$.ajax({
			type: "POST", 
			url: config["api url"]+"/api/v1/auth/",
			data: authjson, 
			dataType : "json",
			contentType : "application/json", 
			success: function(reponse) {
				// create model and view for "archive page" after login
				var model = new ModelAjax(archiveConfig);
				var view = new listView(model, $('#archiveList'));

				//change to archive page
				$( ":mobile-pagecontainer" ).pagecontainer( "change", "#archivePage");
				validateSession = setInterval(session_checking, 20000);
			}, // end success
			// popup invalid password or login 
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				$.mobile.changePage(config["simple-ui url"]+"/dialog/authfailed.html", { role: "dialog" } );
			} // end error
		}); // end ajax

		evt.preventDefault();
		return false;
	}); // end log in button listener

	/*
	 * disconnection button
	 */ 
	$('.disconnection_button').on('click', function() {
		$.ajax({
			type : "DELETE",
			url : config["api url"]+"/api/v1/auth/",
			success : disconnection,
			error : function(XMLHttpRequest, textStatus, errorThrown) {}
		}); // end ajax
	}); // end disconnection button listener

	/*
	 *
	 */ 
	$('.archiveButtonPage').on('click', function() {
		$('#archive .search').val(null);
		var model = new ModelAjax(archiveConfig);
		var view = new listView(model, $('#archiveList'));
	});
	
	$('.filesButtonPage').on('click', function() {
		$('#archiveFiles .search').val(null);
		// Research Archive Files's configuration
		var configSearchArchiveFiles = {
			'url': config["api url"]+"/api/v1/archivefile/",
			'urlSearch': config["api url"]+"/api/v1/archivefile/search/",
			'keyData': 'archivefile',
			'keySearch': 'archivefiles',
			'dataSearch': {},
			'informations': {
				'title' : 'name',
				'template' : 'template/archiveFiles.html',
				'transform' : function(elt, data) {
					elt.find('#name').text(data.name);
					elt.find('#mimetype').text(data.mimetype);
					elt.find('#owner').text(data.owner);
					elt.find('#groups').text(data.groups);
					elt.find('#ctime').text(data.ctime);
					elt.find('#mtime').text(data.mtime);
					elt.find('#size').text(convertSize(data.size));
					elt.find('#media').text(data.medias);

					var metadata = elt.find('#metadata');
					$.ajax({
						type : "GET",
						context : this,
						url : config["api url"]+"/api/v1/archivefile/metadata/",
						data : {
							id : data.id
						},
						success : function(response) {
							var meta = "{";
							Object.keys(response.metadata).forEach(function (key) {
								meta = meta + '"' + key + '" : ';
								if((response.metadata[key]).constructor === Object){
									var meta1 = "{";
									Object.keys(response.metadata[key]).forEach(function (key2) {
										meta1 = meta1 + '"'+ key2 + '" : "' + (response.metadata[key])[key2] + '"';
									});
									meta1 = meta1 + "}";
									meta = meta + meta1;
								}
								else
									meta = meta + '"'+ response.metadata[key]+'"';
								meta = meta + ' , ';
							});
							meta = meta + "}";
							metadata.text(meta);
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
							metadata.text("No metadata found for this object");
						}
					});

					$.ajax({
						type : "GET",
						context : this,
						url : config["api url"]+"/api/v1/archive/",
						data : {
							id : data.archive
						},
						success : function(response) {
							elt.find('#archivePage a').text(response.archive.name);
							$('#archivePage a').on('click', function() {
								$('#archive .search').val(response.archive.name);
								$('#archive .search').trigger('change');
							});
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
						}
					});

				}
			}, // End function transform
			// Search filter bar
			'search': function(input) {
				var text = input.val();
				if (text.length > 0)
					this.dataSearch.name = text;
				else
					delete this.dataSearch.name;
			} // End search
		}; // End archive's files configuration

		// Create a model and a view for Archive Files's list
		var archiveFilesModel = new ModelAjax(configSearchArchiveFiles);
		var archiveFilesView = new listView(archiveFilesModel, $('#archiveFilesList'));
	});

	$('.mediaButtonPage').on('click', function() {
		$('#media .search').val(null);
		// Media's configuration
		var mediaConfig = {
			'url' : config["api url"]+"/api/v1/media/",
			'keyData' : 'media',
			'keySearch' : 'medias',
			'dataSearch' : {
				// Provide a Media's ID to get its information
			//	id : data.media
			}, // End dataSearch
			'informations' : {
				'title' : 'name',
				'template' : 'template/media.html',
				'transform' : function(elt, data) {
					elt.find('#name').text(data.name);
					elt.find('#label').text(data.label);
					elt.find('#pool').text(data.pool.name);
					elt.find('#format').text(data.mediaformat.name);
					elt.find('#uuid').text(data.uuid);
					elt.find('#firstused').text(data.firstused.date);
					elt.find('#usebefore').text(data.usebefore.date);

					var espace_used = elt.find('#spaceused');
					espace_used.find('meter').attr('min',0);
					espace_used.find('meter').attr('max',data.totalblock * data.blocksize);
					espace_used.find('meter').attr('value',(data.totalblock * data.blocksize) - (data.blocksize * data.freeblock));
					espace_used.find('label').text(convertSize((data.totalblock * data.blocksize) - (data.blocksize * data.freeblock))+"/"+convertSize(data.totalblock * data.blocksize));
					espace_used.find('label').css('text-align','center');
				}, // End transform
			}, // End informations
			'search': function(input) {
				var text = input.val();

				if (text.length > 0)
					this.dataSearch.name = text;
				else
					delete this.dataSearch.name;
			}
		}; // End mediaConfig

		// Create Media's model and view
		var mediaModel = new ModelAjax(mediaConfig);
		var mediaView = new listView(mediaModel, $('#mediaList'));
	});
	
	var adminConfig = {
		'url' : config["api url"]+"/api/v1/user/",
		'keyData' : 'user',
		'keySearch' : 'users',
		'dataSearch' : {
		}, // End dataSearch
		'informations' : {
			'title' : 'login',
			'template' : 'template/administration.html',
			'transform' : function(elt, data) {
				elt.find('#Tid').text(data.id);
				elt.find('#Tlogin').text(data.login);
				elt.find('#Tfullname').text(data.fullname);
				elt.find('#Temail').text(data.email);
				elt.find('#Thomedirectory').text(data.homedirectory);
				elt.find('#Tisadmin').text(data.isadmin);
				elt.find('#Tcanarchive').text(data.canarchive);
				elt.find('#Tcanrestore').text(data.canrestore);
				elt.find('#Tdisabled').text(data.disabled);

				if(data.poolgroup === null)
					elt.find('#Tpoolgroup').text("no poolgroup affected");
				else
				{
					$.ajax({
						url: config['api url']+'/api/v1/poolgroup/?id='+data.poolgroup,
						type: "GET",
						dataType: 'json',
						context : elt,
						success: function(response) {
							this.find('#poolgroup').text(response.poolgroup["name"]);
						},
						error: function(XMLHttpRequest, textStatus, errorThrown) {
							//alert("error");
						}
					});
				}

				elt.find('#EditUserButton').on('click', data, function(evt) {
					$( ":mobile-pagecontainer" ).pagecontainer( "change", "#modUserPage");
					$('#addUserButton').hide();
					$('#headerAdd').hide();
					$('#editButton').show();
					$('#headerEdit').show();
					$.ajax({ //Pre-filling user's informations in the edit form
						type: "GET",
						url : config["api url"]+"/api/v1/user/?id=" + evt.data.id,
						ContentType : "application/json",
						success : function(response) {
							$('#login').val(response.user['login']);
							$('#fullname').val(response.user['fullname']);
							$('#email').val(response.user['email']);
							$('#homedir').val(response.user['homedirectory']);
							if(response.user['isadmin']) $("#canadmin").prop("checked",true).checkboxradio("refresh");
							if(response.user['canarchive']) $("#canarchive").prop("checked",true).checkboxradio("refresh");
							if(response.user['canrestore']) $("#canrestore").prop("checked",true).checkboxradio("refresh");
							if(response.user['disabled']) $("#disabled").prop("checked",true).checkboxradio("refresh");

							var bttnEdit = $('#editButton');
							bttnEdit.on('click', evt.data, function(evt) {
								var dataEdit = null;
								if ($('#pwd').val().length > 0){
									dataEdit = JSON.stringify({
										id : evt.data.id,
										login: $('#login').val(),
										fullname: $('#fullname').val(),
										password: $('#pwd').val(),
										email: $('#email').val(),
										homedirectory: $('#homedir').val(),
										isadmin: $('[name="canadmin"]:checked').length > 0,
										canarchive: $('[name="canarchive"]:checked').length > 0,
										canrestore: $('[name="canrestore"]:checked').length > 0,
										meta : {},
										poolgroup: parseInt($('[name="poolgroup"]').val()),
										disabled: $('[name="disabled"]:checked').length > 0
									});
								}
								else {
									dataEdit = JSON.stringify({
										id : evt.data.id,
										login: $('#login').val(),
										fullname: $('#fullname').val(),
										email: $('#email').val(),
										homedirectory: $('#homedir').val(),
										isadmin: $('[name="canadmin"]:checked').length > 0,
										canarchive: $('[name="canarchive"]:checked').length > 0,
										canrestore: $('[name="canrestore"]:checked').length > 0,
										meta : {},
										poolgroup: parseInt($('#poolgroup').val()),
										disabled: $('[name="disabled"]:checked').length > 0
									});
								}
								$.ajax({
									type: "PUT",
									url : config["api url"]+"/api/v1/user/",
									dataType: 'json',
									contentType : 'application/json',
									data: dataEdit,
									success: function(response) {
										$('#login').val('');
										$('#fullname').val('');
										$('#pwd').val('');
										$('#email').val('');
										$('#homedir').val('');
										$("#canadmin").prop("checked",false).checkboxradio().checkboxradio("refresh");
										$("#canarchive").prop("checked",false).checkboxradio().checkboxradio("refresh");
										$("#canrestore").prop("checked",false).checkboxradio().checkboxradio("refresh");
										$("#disabled").prop("checked",false).checkboxradio().checkboxradio("refresh");
										$('[name="poolgroup"]').val('').selectmenu().selectmenu('refresh', true);
										bttnEdit.off('click');

										$.mobile.changePage(config["simple-ui url"]+"/dialog/editUserSuccess.html",{role:"dialog"});

										var adminModel = new ModelAjax(adminConfig);
										var adminView = new listView(adminModel, $('#administrationList'));
										$( ":mobile-pagecontainer" ).pagecontainer( "change", "#administrationPage");
									},
									error: function(XMLHttpRequest, textStatus, errorThrown) {
										$.mobile.changePage(config["simple-ui url"]+"/dialog/editUserFail.html",{role:"dialog"});
										bttnEdit.off('click');
									}
								});
							});
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
						}
					});
				});

				$('#RemoveUserButton').on('click', function() {
					$.ajax({
						type : "DELETE",
						url : config["api url"]+"/api/v1/user/?id="+data.id,
						dataType: 'json',
						success : function(response) {
							$.mobile.changePage(config["simple-ui url"]+"/dialog/removeUserSuccess.html", {role:"dialog"});
							var adminModel = new ModelAjax(adminConfig);
							var adminView = new listView(adminModel, $('#administrationList'));
							$( ":mobile-pagecontainer" ).pagecontainer( "change", "#administrationPage");
						},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
							$.mobile.changePage(config["simple-ui url"]+"/dialog/removeUserFail.html", {role:"dialog"});
							var adminModel = new ModelAjax(adminConfig);
							var adminView = new listView(adminModel, $('#administrationList'));
							$( ":mobile-pagecontainer" ).pagecontainer( "change", "#administrationPage");
						}
					});
				});

				if(data.disabled == true)
					$('#RemoveUserButton').hide();
			}, // End transform
		}, // End informations
		'search': function(input) {
			var text = input.val();

			if (text.length > 0)
				this.dataSearch.login = text;
			else
				delete this.dataSearch.login;
		}
	}; // End adminConfig
	
	$('.administrationButtonPage').on('click', function() {
		$('#administration .search').val(null);
		// Create Aministration's model and view
		var adminModel = new ModelAjax(adminConfig);
		var adminView = new listView(adminModel, $('#administrationList'));
	});

	function poolGroupMenu() {
		$('#poolgroup > ~').remove();
		$.ajax({
			url: config['api url']+'/api/v1/poolgroup/search/',
			type: "GET",
			dataType: 'json', 
			success: function(response) {
				for(var i = 0; i < response.poolgroups.length; i++){
					$.ajax({
						url: config['api url']+'/api/v1/poolgroup/?id='+response.poolgroups[i],
						type: "GET",
						dataType: 'json',
						success: function(response) {
							$('#poolgroup').append('<option value="'+response.poolgroup["id"]+'">'+response.poolgroup["name"]+'</option>');
						},
						error: function(XMLHttpRequest, textStatus, errorThrown) {}
					});
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {}
		});
	}

	$('#AddButton').on('click', function() {
		$('#addUserButton').show();
		$('#headerAdd').show();
		$('#editButton').hide();
		$('#headerEdit').hide();
		poolGroupMenu();
	});

	$('#addUserButton').on('click', function() {
		$.ajax({
			url: config['api url']+'/api/v1/user/',
			type: "POST",
			dataType: 'json',
			contentType : 'application/json', 
			data: JSON.stringify({
				login: $('#login').val(),
				fullname: $('#fullname').val(),
				password: $('#pwd').val(),
				email: $('#email').val(),
				homedirectory: $('#homedir').val(),
				isadmin: $('[name="canadmin"]:checked').length > 0,
				canarchive: $('[name="canarchive"]:checked').length > 0,
				canrestore: $('[name="canrestore"]:checked').length > 0,
				poolgroup: parseInt($('[name="poolgroup"]').val()),
				disabled: $('[name="disabled"]:checked').length > 0
			}),
			success: function(response) {
				$.mobile.changePage(config["simple-ui url"]+"/dialog/addUserSuccess.html",{role:"dialog"});
				var adminModel = new ModelAjax(adminConfig);
				var adminView = new listView(adminModel, $('#administrationList'));
				$( ":mobile-pagecontainer" ).pagecontainer( "change", "#administrationPage");
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				$.mobile.changePage(config["simple-ui url"]+"/dialog/addUserFail.html",{role:"dialog"});
			}
		});
	});
}



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
			url : this.config.urlSearch || this.config.url,
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

		console.log(config.url);

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
			limit.selectmenu( "refresh" );
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

function disconnection() {
	clearInterval(validateSession);
	validateSession = null;
	$( ":mobile-pagecontainer" ).pagecontainer( "change", "#authentification_page");
}

function session_checking() //warn the user of a timeout session
{
	$.ajax({
			type: "GET", 
			url: config["api url"]+"/api/v1/auth/", 
			contentType : "application/json", 
			success: function(reponse) {
			}, // end success
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				$.mobile.changePage(config["simple-ui url"]+"/dialog/timeout.html", { role: "dialog" } );
				disconnection();

			} // end error
		}); // end ajax
}
