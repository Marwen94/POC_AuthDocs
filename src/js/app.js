
App = {
	web3Provider: null,
	contracts: {},

	init: function() {
		return App.initWeb3();
	},

	initWeb3: function() {
		// TODO : voir si l'init n'est pas à changer avec la nouvelle version de METAMASK
		if (typeof web3 !== 'undefined') {
			// If a web3 instance is already provided by Meta Mask.
			App.web3Provider = web3.currentProvider;
			web3 = new Web3(web3.currentProvider);
		} else {
			// Specify default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
			web3 = new Web3(App.web3Provider);
		}

		return App.initContract();
	},

	initContract: function() {
		$.getJSON("Cv.json", function(cv) {
			// Instantiate a new truffle contract from the artifact
			App.contracts.Cv = TruffleContract(cv);
			// Connect provider to interact with contract
			App.contracts.Cv.setProvider(App.web3Provider);

			// Load account data
			web3.eth.getCoinbase(function(err, account) {
			  if (err === null) {

				App.account = account;
						// TODO : j'ai dû ajouté ce default account (new version metamask?)
						web3.eth.defaultAccount = account;
				$("#accountAddress").html("Your Account: " + account);

			  }
			});

			App.contracts.Cv.deployed().then(function(instance) {
				cvInstance = instance;
				account = App.account;
				console.log(account);
				return cvInstance.getUser(account);
			}).then(function(user) {
				console.log(user[0], user[1], user[2]);
				var user_type=user[2];
				if(user_type == 1) {
					$("#identification").html("identifié comme un citoyen : " +  user[1] );
				} else if (user_type == 2) {
					$("#identification").html("identifié comme un valideur : " + user[1] );
				}else{
					console.log(user_type);
					$("#identification").html("cet utilisateur n'est pas identifié !!!");
				}
			});

			App.contracts.Cv.deployed().then(function(instance) {
			  cvInstance = instance;
				return cvInstance.getFirstUser();
			}).then(function(user){console.log(user)});

			return App.render();
		});

		return App.bindEvents();
	},


	render: function(page) {
		$("#itemRow").empty();
		$('#itemRow_Validation').empty();
		$('#page_title').empty();
		$("#page_content").empty();
		$("#itemForm").hide();
		$('#validationEntityForm').hide();
    $('#itemRow_Validation').hide();
    $('#identité_form').hide();
		if (page == null) {
			page = 'moncv'
		}
		var cvInstance;

		if (page == 'moncv') {
			$('#page_title').html('Mes documents');
			$('#validationEntityForm').hide();
			$('#itemRow_Validation').hide();
			// Load contract data
			App.contracts.Cv.deployed().then(function(instance) {
				cvInstance = instance;
				return cvInstance.getItemsCountForUser();
			}).then(function(itemCount) {
				if (itemCount != 0) {
					//alert(App.account + " a des items : " + itemCount);
					for (numItem=0; numItem< itemCount; numItem++) {
						cvInstance.getItemsIdByUserIndex(numItem).then(function(itemIndex) {
							//alert(App.account + " a l'item " + numItem + " qui a l'index : " + itemIndex);
							cvInstance.getItemsByItemIndexForUser(itemIndex).then(function(item) {
								//$("#itemRow").empty();
								console.log(item);
								var itemRow = $('#itemRow');
								var itemTemplate = $('#itemTemplate');
								itemTemplate.find('.card-header').text(item[1]);
								itemTemplate.find('img').attr('src', item[3]);
								itemTemplate.find('.item-description').text(item[2]);
								itemTemplate.find('.item-type').text(item[0]);
								if (item[5] == "0x0000000000000000000000000000000000000000") {
								  itemTemplate.find('.badge').removeClass('badge-success');
									itemTemplate.find('.badge').addClass('badge-danger');
									itemTemplate.find('.badge').text("Not validated ");
									itemTemplate.find('.item-validation').text("0x0000");
								} else {
									itemTemplate.find('.badge').removeClass('badge-danger');
									itemTemplate.find('.badge').addClass('badge-success');
									itemTemplate.find('.item-validation').text(item[5]);
									itemTemplate.find('.badge').text("Validated");
								}
								//alert("ajout de la ligne avec titre : "+item[1]);
								itemRow.append(itemTemplate.html());
							});
						});
					}
				} else {
					$("#page_content").html("La blockchain est vide pour ce compte...");
				}
			}).catch(function(error) {
				console.warn(error);
				$("#msg_danger").html("Impossible de se connecter au contrat dans blockchain!!!");
				$("#msg_danger_template").show();
			});
		} else if (page == 'viewAll') {
			$('#page_title').html('Blockchain entière');
			$('#validationEntityForm').hide();
			$('#itemRow_Validation').hide();
			// Load contract data
			App.contracts.Cv.deployed().then(function(instance) {
				cvInstance = instance;
				return cvInstance.itemCount();
			}).then(function(itemCount) {
				if (itemCount != 0) {
					for (itemIndex=0; itemIndex< itemCount; itemIndex++) {
						cvInstance.getItemsByItemIndex(itemIndex).then(function(item) {
							console.log("Im here");
							var itemRow = $('#itemRow');
							var itemTemplate = $('#itemTemplate');
							itemTemplate.find('.card-header').text(item[2]);
							itemTemplate.find('img').attr('src', item[4]);
							itemTemplate.find('.item-description').text(item[3]);
							itemTemplate.find('.item-type').text(item[1]);
							if (item[6] == "0x0000000000000000000000000000000000000000") {
								itemTemplate.find('.item-validation').text("");
								itemTemplate.find('.badge').text("");
							} else {
								itemTemplate.find('.item-validation').text(item[6]);
								itemTemplate.find('.badge').text("Validated");
							}
							itemTemplate.find('.item-adresse').text(item[0]);
							itemTemplate.find('.item-adresse-section').show();
							itemRow.append(itemTemplate.html());
						});
					}
				} else {
					$("#page_content").html("La blockchain est vide pour ce compte...");
				}
			}).catch(function(error) {
				console.warn(error);
				$("#msg_danger").html("Impossible de se connecter au contrat dans blockchain!!!");
				$("#msg_danger_template").show();
			});
		} else if (page == 'additem') {
			$('#validationEntityForm').hide();
			$('#itemRow_Validation').hide();
			$('#page_title').html('Ajouter un document');
			$("#page_content").html("Formulaire de l'item");
			$("#itemForm").show();

		} else if (page == 'validationitems') {
			$('#page_title').html('Valider un document');
			$("#validationEntityForm").show();
			$('#itemRow_Validation').show();
			var validation_type = $('#type_Valideur').val();
			App.contracts.Cv.deployed().then(function(instance) {    ///////
				cvInstance = instance;
				return cvInstance.itemCount();
			}).then(function(itemCount) {
				if (itemCount != 0) {
					for (itemIndex=0; itemIndex< itemCount; itemIndex++) {
						cvInstance.getItemsByItemIndex(itemIndex).then(function(item) {
							//console.log(validation_type);
							if (item[1] == validation_type) {
								var itemRow = $('#itemRow_Validation');
								var itemTemplate = $('#itemTemplate');
								itemTemplate.find('.card-header').text(item[2]);
								itemTemplate.find('img').attr('src', item[4]);
								itemTemplate.find('.item-description').text(item[3]);
								itemTemplate.find('.item-type').text(item[1]);
							  itemTemplate.find('.item-adresse').text(item[0]);
							  itemTemplate.find('.item-adresse-section').show();
							  itemRow.append(itemTemplate.html());
								//console.log(, typeof itemRow );
							//	$("#page_content").html("Aucun document à valider pour ce valideur!");
						} else {
							$("#content2").html("Aucun document à valider pour cette entité!");
						}});
					}
				}
				}).catch(function(error) {
					console.warn(error);
					$("#msg_danger").html("Impossible de se connecter au contrat dans blockchain!!!");
					$("#msg_danger_template").show();
          });
    } else if (page == 'identity') {

			web3.eth.getCoinbase(function(err, account) {
				if (err === null) {
				App.account = account;
						web3.eth.defaultAccount = account;
				}
				$('#identité_form').show();
				document.getElementById('adresse_user').value = account;
			});
		}
	},


	bindEvents: function() {
		$(document).on('click', "button.btn-validate", function (e) {
			item_id = $('#itemTemplate').find('.btn-validate').attr('data-id');
			App.contracts.Cv.deployed().then(function(instance) {
				cvInstance = instance;
				//alert("avant valication de l'item " +item_id);
				cvInstance.validateItem(item_id).then(function() {
					//alert("ok validé");
					return App.render('moncv');
				}).catch(function(error) {
					console.warn(error);
					$("#msg_danger").html("Impossible de valider l'item dans la blockchain!!!");
					$("#msg_danger_template").show();
					alert("warning affiché");
				});
			});

		});
		$(document).on('click', "button.close", function (e) {
			//alert('clic sur bouton close de la popup');
			$(this).parent().hide();
		});
		$('#url').on({
			'change' : function() {
				$('#url_preview').attr('src', $('#url').val());
			}
		});
		$('body').click(function(evt) {
			if (evt.target.id == "nav_moncv") {
				$("#nav_moncv").addClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").removeClass('active');
				$("#nav_validation").removeClass('active');
				$("#nav_identité").removeClass('active');
				return App.render('moncv');
			} else if (evt.target.id == "nav_addItem"){
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").addClass('active');
				$("#nav_viewAll").removeClass('active');
				$("#nav_validation").removeClass('active');
				$("#nav_identité").removeClass('active');
				return App.render('additem');
			} else if (evt.target.id == "nav_viewAll"){
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").addClass('active');
				$("#nav_validation").removeClass('active');
				$("#nav_identité").removeClass('active');
				return App.render('viewAll');
			} else if (evt.target.id == "nav_validation") {
				$("#nav_validation").addClass('active');
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").removeClass('active');
				$("#nav_identité").removeClass('active');
				return App.render('validationitems');
			} else if (evt.target.id == "nav_identité") {
				$("#nav_identité").addClass('active');
				$("#nav_validation").removeClass('active');
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").removeClass('active');
				return App.render('identity');
			} else if (evt.target.id == "search-button"){
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").removeClass('active');
				$("#nav_validation").removeClass('active');
				$("#nav_identité").removeClass('active');
				$("#itemRow").empty();
				$('#page_title').empty();
				$('#page_title').html('Validate item');
				$("#page_content").empty();
				$("#itemForm").hide();
				var search = $('#search-value').val();
				// Faut enregistrer dans la blockchain
				App.contracts.Cv.deployed().then(function(instance) {
					cvInstance = instance;
					cvInstance.getItemsByItemIndex(search).then(function(item) {
						var itemRow = $('#itemRow');
						var itemTemplate = $('#itemTemplate');
						itemTemplate.find('.card-header').text(item[2]);
						itemTemplate.find('img').attr('src', item[4]);
						itemTemplate.find('.item-description').text(item[3]);
						itemTemplate.find('.item-type').text(item[1]);
						itemTemplate.find('.item-adresse').text(item[0]);
						itemTemplate.find('.item-adresse-section').show();
						itemTemplate.find('.item-bouton-section').show();
						itemTemplate.find('.btn-validate').attr('data-id', search);
						itemRow.append(itemTemplate.html());

					}).catch(function(error) {
						console.warn(error);
						$("#msg_danger").html("Impossible de se connecter au contrat dans blockchain!!!");
						$("#msg_danger_template").show();
						alert("warning affiché");
					});

				}).catch(function(error) {
					console.warn(error);
					$("#msg_danger").html("Impossible de se connecter au contrat dans blockchain!!!");
					$("#msg_danger_template").show();
					alert("warning affiché");
				});
			} else if (evt.target.id == "item_submit"){
				var item_type = $('#type').val();
				var item_nom = $('#nom').val();
				var item_description =$('#description').val();
				var item_url =$('#url').val();

				// Faut enregistrer dans la blockchain
				App.contracts.Cv.deployed().then(function(instance) {
					cvInstance = instance;
					return cvInstance.createItem(item_type, item_nom, item_description, item_url, item_url);
				}).then(function(val) {
					$("#msg_success").html("Nouvel item enregistré dans la blockchain!!!");
					$("#msg_success_template").show();//("slow").delay(2000).hide("slow");
					$("#nav_moncv").addClass('active');
					$("#nav_addItem").removeClass('active');
					return App.render('moncv');

				}).catch(function(error) {
					console.warn(error);
					$("#msg_danger").html("Impossible d'enregistrer l'item dans blockchain!!!");
					$("#msg_danger_template").show();
				});
			} else if (evt.target.id == "identité_submit") {
				var address = $('#adresse_user').val();
				var nom = $('#nom_user').val();
				var type_user = $('#type_user').val();
				console.log(address , nom , type_user);
				App.contracts.Cv.deployed().then(function(instance) {
					cvInstance = instance;
					return cvInstance.CreateUser(address, nom, type_user);
				}).then(function(val){

					$("#msg_success").html("Nouvel utilisateur est enregistré!!!");
					$("#msg_success_template").show();
					if(type_user == 1){
						$("#nav_addItem").addClass('active');
						$("#nav_identité").removeClass('active');
						return App.render('additem');
					}else{
						$("#nav_validation").addClass('active');
						$("#nav_identité").removeClass('active');
						return App.render('validationitems');
					}
				}).catch(function(error) {
					console.warn(error);
					$("#msg_danger").html("Impossible d'enregistrer cet utilisateur!!!");
					$("#msg_danger_template").show();
				});
			}
		});
	},
};

$(function() {
	$(window).on('load', function() {
	//	App.use(express.static('src/upload_parser.php'));
		App.init();
	});
});
