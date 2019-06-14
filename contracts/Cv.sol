pragma solidity ^0.4.5;

//mettre les modifiers pour interdire certaines fonction
// mettre un status pour autoriser certaines fonctions que selon certains status (see state machine pattern dans doc solidity)
//IPFS

contract Cv {

   uint80 constant None = uint80(0);
	// d�finir les evts
	struct Item {
			uint8 item_type;             // 1 : Diplôme, 2 : Fiche de paie, 3 : Justificatif de domicile, 4 : document d'assurance
			string nom;
			string description;
			string url;
			uint date;
			address validated_by;
			string file_sha1;
	}

  struct User {

    address user_address;
    string  user_name;
    uint8   user_type;     // 1: citoyen, 2: validation entity

  }

	address owner;
	uint128 public itemCount;         //Nombre des docs
  uint128 public userCount;         //Nombre des utilisateurs
	Item[] public items;             //La liste de tout les docs
  User[] public users;             //La liste de tout les utilisateurs
	mapping (address => uint32) itemCountByUser;   //Nombre de docs par utilisateur
	mapping (uint128 => address) userByItem; //itemIndex -> address
	mapping (address => mapping (uint32 => uint128)) itemByIdByUser; //address -> itemIndexByUser -> itemIndex
  mapping (address => uint128) usersIndex; //address to index_user


    modifier onlyBy(address _account)
    {
        require(msg.sender == _account,"Sender not authorized.");
        _;
    }
    modifier onlyOwner()
    {
        require(msg.sender == owner,"You must be the contract owner");
        _;
    }
	//	modifier onlyValidateur()
		//{
		   // require(isValidateur(msg.sender),"You must be a validateur");
	    //	_;
	//	}

	//	modifier onlyNormalUser()
	//	{
	//			require( !isValidateur(msg.sender),"You must be a normal user");
	//			_;
	//	}

    constructor() public {
        owner = msg.sender;
    }

    //Ajouter un utilisateur en indiquant sa nature
	function CreateUser(address _user_address, string  _user_name, uint8  _user_type) public returns (bool success) {
				User memory newUser;
        newUser.user_address = _user_address;
        newUser.user_name = _user_name;
        newUser.user_type = _user_type;
        usersIndex[_user_address] = userCount; // add user to users mapping
        users.push(newUser);
        userCount++;
        return true;
		}

  //getter of user
  function getUser(address _user_address) external view returns(address,string, uint8 ){
        User memory user;
        user=users[usersIndex[_user_address]];
        return (user.user_address , user.user_name , user.user_type);
    }

  //Test function
  function getFirstUser() external view returns(address,string,uint8) {
        User memory user;
        user = users[0];
        return (user.user_address , user.user_name , user.user_type);
    }

	// Enregistre un nouvel item
	function createItem(uint8 _item_type, string _nom, string _description, string _url, string _file_sha1)  public  returns (bool success) { //onlyNormalUser
		Item memory newItem;
		newItem.item_type = _item_type;
		newItem.nom = _nom;
		newItem.description = _description;
		newItem.url = _url;
		newItem.date = now;
		newItem.file_sha1 = _file_sha1;
		items.push(newItem);

		userByItem[itemCount] = msg.sender;
		itemByIdByUser[msg.sender][itemCountByUser[msg.sender]] = itemCount;
		itemCount++;
		itemCountByUser[msg.sender]++;
		return true;
	}

	// R�cup�rer le nombre d'item d'un utilisateur
	function getItemsCountForUser() external view returns(uint32)  {
		return itemCountByUser[msg.sender];
	}

	function getItemsIdByUserIndex(uint32 _index) external view returns(uint128) {
		return itemByIdByUser[msg.sender][_index];
	}

	function getItemsByItemIndexForUser(uint128 _index) external view returns(uint8, string, string, string, string,address) {
		//require(msg.sender == userByItem[_index],"item owner is not who asked to see item");
	    require(_index < itemCount,"This Item doesn't exist");
		return (items[_index].item_type,
		        items[_index].nom,
		        items[_index].description,
		        items[_index].url,
		        items[_index].file_sha1,
		        items[_index].validated_by
		        );
	}

	function getItemsByItemIndex(uint128 _index) external view onlyOwner returns(address, uint8, string, string, string, string,address)  {
	    require (_index < itemCount,"This Item doesn't exist");
		return (userByItem[_index],
		        items[_index].item_type,
		        items[_index].nom,
		        items[_index].description,
		        items[_index].url,
		        items[_index].file_sha1,
		        items[_index].validated_by
		        );
	}

	//function isValidateur(address _address) public returns (bool){
	//		if (users[_address].user_type == 2 ){
	//				return true;
		//	}
		//	return false;
	//}

	function validateItem(uint128 _index) external {  // onlyValidateur
	  require (_index < itemCount,"This Item doesn't exist");
		items[_index].validated_by = msg.sender;
	}
}
