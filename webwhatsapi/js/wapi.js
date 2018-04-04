/**
 * This script contains WAPI functions that need to be run in the context of the webpage
 */

/* global Store */

var WAPI = {
	lastRead: {},
};

WAPI._serializeRawObj = obj => {
	if (obj) {
		return obj.toJSON();
	}
	return {}
};

/**
 * Serializes a chat object
 *
 * @param rawChat Chat object
 * @returns {{}}
 */

WAPI._serializeChatObj = obj => {
	if (obj == null) {
		return null;
	}

	return Object.assign(WAPI._serializeRawObj(obj), {
		kind: obj.kind,
		isGroup: obj.isGroup,
		contact: obj['contact']? WAPI._serializeContactObj(obj['contact']): null,
		groupMetadata: obj['groupMetadata']? WAPI._serializeRawObj(obj['groupMetadata']): null,
		presence: obj['presence']? WAPI._serializeRawObj(obj['presence']):null,
		msgs: null,
	});
};

WAPI._serializeContactObj = obj => {
	if (obj == null) {
		return null;
	}

	return Object.assign(WAPI._serializeRawObj(obj), {
		formattedName: obj.formattedName,
		isHighLevelVerified: obj.__x_isHighLevelVerified,
		isMe: obj.isMe,
		isMyContact: obj.isMyContact,
		isPSA: obj.isPSA,
		isUser: obj.isUser,
		isVerified: obj.isVerified,
		isWAContact: obj.isWAContact,
		profilePicThumbObj: obj.profilePicThumb ? WAPI._serializeRawObj(obj.profilePicThumb):{},
		statusMute: obj.statusMute,
		msgs: null,
	});
};

WAPI._serializeMessageObj = obj => {
	if (obj == null) {
		return null;
	}

	return Object.assign(WAPI._serializeRawObj(obj), {
		id: obj.id._serialized,
		sender: obj['senderObj']?WAPI._serializeContactObj(obj['senderObj']): null,
		timestamp: obj['t'],
		content: obj['body'],
		caption: obj.caption,
		isGroupMsg: obj.isGroupMsg,
		isLink: obj.isLink,
		isMMS: obj.isMMS,
		isMedia: obj.isMedia,
		isNotification: obj.isNotification,
		isPSA: obj.isPSA,
		isSentByMe: obj.isSentByMe,
		isSentByMeFromWeb: obj.isSentByMeFromWeb,
		type: obj.type,
		chat: WAPI._serializeChatObj(obj['chat']),
		chatId: obj.id.remote,
		quotedMsgObj: WAPI._serializeMessageObj(obj.quotedMsgObj()),
		mediaData: WAPI._serializeRawObj(obj['mediaData']),
	});
};

/**
 * Fetches all contact objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of contacts
 */
WAPI.getAllContacts = function (done) {
	const contacts = Store.Contact.models.map(contact => WAPI._serializeContactObj(contact));

	if (done !== undefined) {
		done(contacts);
	} else {
		return contacts;
	}
};
/**
 * Fetches all contact objects from store, filters them
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of contacts
 */
WAPI.getMyContacts = function (done) {
	const contacts = Store.Contact.models.filter(d => d.__x_isMyContact === true).map(contact => WAPI._serializeContactObj(contact));

	if (done !== undefined) {
		done(contacts);
	} else {
		return contacts;
	}
};

/**
 * Fetches contact object from store by ID
 *
 * @param id ID of contact
 * @param done Optional callback function for async execution
 * @returns {T|*} Contact object
 */
WAPI.getContact = function (id, done) {
	const found = Store.Contact.models.find(contact => contact.id === id);

	if (done !== undefined) {
		done(WAPI._serializeContactObj(found));
	} else {
		return WAPI._serializeContactObj(found);
	}
};

/**
 * Fetches all chat objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chats
 */
WAPI.getAllChats = function (done) {
	const chats = Store.Chat.models.map(chat => WAPI._serializeChatObj(chat));

	if (done !== undefined) {
		done(chats);
	} else {
		return chats;
	}
};

/**
 * Fetches all chat IDs from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chat id's
 */
WAPI.getAllChatIds = function (done) {
	const chatIds = Store.Chat.models.map(chat => chat.id);

	if (done !== undefined) {
		done(chatIds);
	} else {
		return chatIds;
	}
};

/**
 * Fetches all groups objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of chats
 */
WAPI.getAllGroups = function (done) {
	const groups = WAPI.getAllChats().filter(chat => chat.isGroup);

	if (done !== undefined) {
		done(groups);
	} else {
		return groups;
	}
};

/**
 * Fetches chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns {T|*} Chat object
 */
WAPI.getChat = function (id, done) {
	const found = Store.Chat.models.find(chat => chat.id === id);
	if (done !== undefined) {
		done(found);
	} else {
		return found;
	}
};

WAPI.getChatById = function (id, done) {
	let found = WAPI.getChat(id);
	if (found) {
		found = WAPI._serializeChatObj(found);
	} else {
		found = false;
	}

	if (done !== undefined) {
		done(found);
	} else {
		return found;
	}
};


/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns None
 */
WAPI.loadEarlierMessages = function (id, done) {
	const found = Store.Chat.models.find(chat => chat.id === id);
	if (done !== undefined) {
		found.loadEarlierMsgs().then(function(){
			done()
		});
	} else {
		found.loadEarlierMsgs();
	}
};

/**
 * Load more messages in chat object from store by ID
 *
 * @param id ID of chat
 * @param done Optional callback function for async execution
 * @returns None
 */

WAPI.loadAllEarlierMessages = function (id, done) {
	const chat = Store.Chat.models.find(chat => chat.id === id);
	const fetch = function () {
		if (!chat.msgs.msgLoadState.__x_noEarlierMsgs){
			chat.loadEarlierMsgs().then(fetch);
		} else if (done) {
			done();
		}
	};
	fetch();
};

WAPI.asyncLoadAllEarlierMessages = function (id, done) {
	done();
	WAPI.loadAllEarlierMessages(id);
};

WAPI.areAllMessagesLoaded = function (id, done) {
	const chat = Store.Chat.models.find(chat => chat.id === id);
	if (!chat.msgs.msgLoadState.__x_noEarlierMsgs) {
		if (done) {
			done(false);
		} else {
			return false
		}
	}
	if (done) {
		done(true);
	} else {
		return true
	}
};

/**
 * Load more messages in chat object from store by ID till a particular date
 *
 * @param id ID of chat
 * @param lastMessage UTC timestamp of last message to be loaded
 * @param done Optional callback function for async execution
 * @returns None
 */

WAPI.loadEarlierMessagesTillDate = function (id, lastMessage, done) {
	const found = Store.Chat.models.find(chat => chat.id === id);
	const fetch = function(){
		if (found.msgs.models[0].t > lastMessage) {
			found.loadEarlierMsgs().then(fetch);
		}else {
			done();
		}
	};
	fetch();
};


/**
 * Fetches all group metadata objects from store
 *
 * @param done Optional callback function for async execution
 * @returns {Array|*} List of group metadata
 */
WAPI.getAllGroupMetadata = function (done) {
	const groupData = Store.GroupMetadata.models.map(groupData => groupData.all);

	if (done !== undefined) {
		done(groupData);
	} else {
		return groupData;
	}
};

/**
 * Fetches group metadata object from store by ID
 *
 * @param id ID of group
 * @param done Optional callback function for async execution
 * @returns {T|*} Group metadata object
 */
WAPI.getGroupMetadata = async function (id, done) {
	const output = Store.GroupMetadata.models.find(groupData => groupData.id === id);

	if (output !== undefined) {
		if (output.stale) {
			await output.update();
		}
	}

	if (done !== undefined) {
		done(output);
	}
	return output;

};


/**
 * Fetches group participants
 *
 * @param id ID of group
 * @returns {Promise.<*>} Yields group metadata
 * @private
 */
WAPI._getGroupParticipants = async function (id) {
	const metadata = await WAPI.getGroupMetadata(id);
	return metadata.participants;
};

/**
 * Fetches IDs of group participants
 *
 * @param id ID of group
 * @param done Optional callback function for async execution
 * @returns {Promise.<Array|*>} Yields list of IDs
 */
WAPI.getGroupParticipantIDs = async function (id, done) {
	const output = (await WAPI._getGroupParticipants(id))
		.map(participant => participant.id);

	if (done !== undefined) {
		done(output);
	}
	return output;
};

WAPI.getGroupAdmins = async function (id, done) {
	const output = (await WAPI._getGroupParticipants(id))
		.filter(participant => participant.isAdmin)
		.map(admin => admin.id);

	if (done !== undefined) {
		done(output);
	}
	return output;
};

/**
 * Gets object representing the logged in user
 *
 * @returns {Array|*|$q.all}
 */
WAPI.getMe = function (done) {
	const contacts = window.Store.Contact.models;

	const rawMe = contacts.find(contact => contact.all.isMe, contacts);

	if (done !== undefined) {
		done(rawMe.all);
	} else {
		return rawMe.all;
	}
	return rawMe.all;
};

WAPI.processMessageObj = function (messageObj, includeMe, includeNotifications) {
	if (messageObj.isNotification) {
		if(includeNotifications) {
			return WAPI._serializeMessageObj(messageObj);
		} else {
			return;
		}
		// System message
		// (i.e. "Messages you send to this chat and calls are now secured with end-to-end encryption...")
	} else if (messageObj.id.fromMe === false || includeMe) {
		return WAPI._serializeMessageObj(messageObj);
	}
	return;
};

WAPI.getAllMessagesInChat = function (id, includeMe, includeNotifications, done) {
	const chat = WAPI.getChat(id);
	const output = [];
	const messages = chat.msgs.models;
	for (const i in messages) {
		if (i === 'remove') {
			continue;
		}
		const messageObj = messages[i];

		const message = WAPI.processMessageObj(messageObj, includeMe, includeNotifications)
		if (message){
			output.push(message);
		}
	}
	if (done !== undefined) {
		done(output);
	} else {
		return output;
	}
};

WAPI.getAllMessageIdsInChat = function (id, includeMe, includeNotifications, done) {
	const chat = WAPI.getChat(id);
	const output = [];
	const messages = chat.msgs.models;
	for (const i in messages) {
		if ((i === 'remove')
			|| (!includeMe && messages[i].isMe)
			|| (!includeNotifications && messages[i].isNotification)) {
			continue;
		}
		output.push(messages[i].id._serialized);
	}
	if (done !== undefined) {
		done(output);
	} else {
		return output;
	}
};

WAPI.getMessageById = function (id, done) {
	try {
		Store.Msg.find(id).then(item => done(WAPI.processMessageObj(item, true, true)))
	} catch (err) {
		done(false);
	}
};

WAPI.sendMessageToID = function (id, message, done) {
	if(Store.Chat.models.length == 0) {
		return false;
	}

	var originalID = Store.Chat.models[0].id;
	Store.Chat.models[0].id = id;
	if (done !== undefined) {
		Store.Chat.models[0].sendMessage(message).then(function(){
			Store.Chat.models[0].id = originalID; done(true); 
		});
		return true;
	} else {
		Store.Chat.models[0].sendMessage(message);
		Store.Chat.models[0].id = originalID;
		return true;
	}

	if (done !== undefined) {
		done();
	} else {
		return false;
	}

	return true;
}

WAPI.sendMessage = function (id, message, done) {
	const Chats = Store.Chat.models;

	for (const chat in Chats) {
		if (isNaN(chat)) {
			continue;
		}

		const temp = {};
		temp.name = Chats[chat].__x__formattedTitle;
		temp.id = Chats[chat].__x_id;
		if (temp.id === id) {
			if (done !== undefined) {
				Chats[chat].sendMessage(message).then(function () {
					function sleep(ms) {
						return new Promise(resolve => setTimeout(resolve, ms));
					}

					var trials = 0;

					function check() {
						for (let i=Chats[chat].msgs.models.length - 1; i >= 0; i--) {
							const msg = Chats[chat].msgs.models[i];

							if (!msg.senderObj.isMe || msg.body != message) {
								continue;
							}
							done(WAPI._serializeMessageObj(msg));
							return True;
						}
						trials += 1;
						console.log(trials);
						if (trials > 30) {
							done(true);
							return;
						}
						sleep(500).then(check);
					}
					check();
				});
				return true;
			} else {
				Chats[chat].sendMessage(message);
				return true;
			}
		}
	}
};


WAPI.sendSeen = function (id, done) {
	const Chats = Store.Chat.models;

	for (const chat in Chats) {
		if (isNaN(chat)) {
			continue;
		}

		const temp = {};
		temp.name = Chats[chat].__x__formattedTitle;
		temp.id = Chats[chat].__x_id;
		if (temp.id === id) {
			if (done !== undefined) {
				Chats[chat].sendSeen(false).then(function () {
					done(true);
				});
				return true;
			} else {
				Chats[chat].sendSeen(false);
				return true;
			}
		}
	}
	if (done !== undefined) {
		done();
	} else {
		return false;
	}
	return false;
};

function isChatMessage(message) {
	if (message.__x_isSentByMe) {
		return false;
	}
	if (message.__x_isNotification) {
		return false;
	}
	if (!message.__x_isUserCreatedType) {
		return false;
	}
	return true;
}


WAPI.getUnreadMessages = function (includeMe, includeNotifications, done) {
	const chats = Store.Chat.models;

	const res = [];
	for (const chat of chats) {
		const messageGroup = WAPI._serializeChatObj(chat);
		messageGroup.messages = [];

		const messages = chat.msgs.models;
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i];
			if (!msg.__x_isNewMsg) {
				break;
			}

			msg.__x_isNewMsg = false;

			const processed = WAPI.processMessageObj(msg, includeMe,  includeNotifications);
			if (msg != null) {
				messageGroup.messages.push(processed);
			}
		}

		if (messageGroup.messages.length > 0) {
			res.push(messageGroup);
		}
	}

	if (done != null) {
		done(res);
	}

	return res;
};

WAPI.getGroupOwnerID = async function (id, done) {
	const output = await WAPI.getGroupMetadata(id).owner.id;
	if (done !== undefined) {
		done(output);
	}
	return output;

};

WAPI.getCommonGroups = async function (id, done) {
	const output = [];
	const groups = WAPI.getAllGroups();

	for (const idx in groups) {
		try {
			const participants = await WAPI.getGroupParticipantIDs(groups[idx].id);
			if (participants.filter(participant => participant === id).length) {
				output.push(groups[idx]);
			}
		} catch(err) {
			console.log('Error in group:');
			console.log(groups[idx]);
			console.log(err);
		}
	}

	if (done !== undefined) {
		done(output);
	}
	return output;
};

WAPI.downloadFile = function (url, done) {
	const xhr = new XMLHttpRequest();

	xhr.onload = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				const reader = new FileReader();
				reader.readAsDataURL(xhr.response);
				reader.onload = function () {
					done(reader.result.substr(reader.result.indexOf(',')+1))
				};
			} else {
				console.error(xhr.statusText);
			}
		}
	};
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	xhr.send(null);
}


window.WAPI = WAPI;
