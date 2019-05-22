pragma solidity ^0.4.5;

//mettre les modifiers pour interdire certaines fonction
// mettre un status pour autoriser certaines fonctions que selon certains status (see state machine pattern dans doc solidity)
//IPFS

contract Cv {

	// d�finir les evts
	struct Item {
			uint8 item_type;             // 1 : Diplome, 2 : Exp�rience, 3 : Certification
			string nom;
			string description;
			string url;
			address validated_by;
			string file_sha1;
	}

	address owner;
	uint128 public itemCount;         //Nombre des docs
	Item[] public items;             //La liste de tout les docs
	mapping (address => uint32) itemCountByUser;   //Nombre de docs par utilisateur
	mapping (uint128 => address) userByItem; //itemIndex -> address
	mapping (address => mapping (uint32 => uint128)) itemByIdByUser; //address -> itemIndexByUser -> itemIndex

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

    constructor() public {
        owner = msg.sender;
    }

	// Enregistre un nouvel item
	function createItem(uint8 _item_type, string _nom, string _description, string _url, string _file_sha1)  public returns (bool success) {
		Item memory newItem;
		newItem.item_type = _item_type;
		newItem.nom = _nom;
		newItem.description = _description;
		newItem.url = _url;
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

	function validateItem(uint128 _index) external onlyOwner  {
		//TODO : ce ne sera plus onlyOwner.
	    require (_index < itemCount,"This Item doesn't exist");
		items[_index].validated_by = msg.sender;
	}
}
