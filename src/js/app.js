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

			return App.render();
		});

		return App.bindEvents();
	},


	render: function(page) {
		$("#itemRow").empty();
		$('#page_title').empty();
		$("#page_content").empty();
		$("#itemForm").hide();
		if (page == null) {
			page = 'moncv'
		}
		var cvInstance;

		if (page == 'moncv') {
			$('#page_title').html('Mon CV');
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

								var itemRow = $('#itemRow');
								var itemTemplate = $('#itemTemplate');
								itemTemplate.find('.card-header').text(item[1]);
								itemTemplate.find('img').attr('src', item[3]);
								itemTemplate.find('.item-description').text(item[2]);
								itemTemplate.find('.item-type').text(item[0]);
								if (item[5] == "0x0000000000000000000000000000000000000000") {
									itemTemplate.find('.badge').text("");
									itemTemplate.find('.item-validation').text("");
								} else {
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
			// Load contract data
			App.contracts.Cv.deployed().then(function(instance) {
				cvInstance = instance;
				return cvInstance.itemCount();
			}).then(function(itemCount) {
				if (itemCount != 0) {
					for (itemIndex=0; itemIndex< itemCount; itemIndex++) {
						cvInstance.getItemsByItemIndex(itemIndex).then(function(item) {
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
				//alert("warning affiché");
			});
		} else if (page == 'additem') {
			$('#page_title').html('Ajouter un item');
			$("#page_content").html("Formulaire de l'item");
			$("#itemForm").show();
		} else {
			//alert("page inconnue "+page);
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
				return App.render('moncv');
			} else if (evt.target.id == "nav_addItem"){
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").addClass('active');
				$("#nav_viewAll").removeClass('active');
				return App.render('additem');
			} else if (evt.target.id == "nav_viewAll"){
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").addClass('active');
				return App.render('viewAll');
			} else if (evt.target.id == "search-button"){
				$("#nav_moncv").removeClass('active');
				$("#nav_addItem").removeClass('active');
				$("#nav_viewAll").removeClass('active');
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
			} else {
				//alert("clic on "+evt.target.id);
			}
		});

	},
};

$(function() {
	$(window).on('load', function() {
		App.init();
	});
});
