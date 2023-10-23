/*
==================================
===== Populate Map Functions =====
==================================
*/

const populateChannelsMap = () => {
    const response = getChannels(getToken())
    .then((data) => {
        if (!data) return false;
        if (data !== false) {
            channels.clear();
            userDetails.clear();
            //messages.clear();
            data.channels.forEach((channel) => {

                if (isValueInArray(channel.members, getUserId())) {
                    channel["userIsMember"] = true;

                    // Populate userDetails with userid's of 
                    // channels current user is a member of
                    channel.members.forEach((user) => {
                        userDetails.set(user, []);
                    });
                } else {
                    channel["userIsMember"] = false;
                }
                channels.set(channel.id, channel);
            }); 
        }

        // TODO: Will error if no channels exist serverside
        if (currentChannel == null) {
            currentChannel = getHighestPriorityChannel(channels);
        } else {
            currentChannel = channels.get(currentChannel.id); // Update currentChannel info
        }

        // Remove server buttons and regenerate list
        removeChildrenNodes(privateChannelsList);
        removeChildrenNodes(publicChannelsList);
        generateChannelButtons(getPrivateChannels(channels), true);
        generateChannelButtons(getPublicChannels(channels), false); 

        return true;
    });
    return response;
}

const loadChannelDetails = () => {
    const success = new Promise((resolve) => {
        const promises = [new Promise((resolve) => { resolve(true)})];
        channels.forEach((channel) => {
            if (isValueInArray(channel.members, getUserId())) {
                promises.push(getChannel(getToken(), channel.id)
                .then((response) => {
                    channel["details"] = response;

                    return response;
                }));
            }
        });

        resolve(Promise.all(promises));
    });

    return success;
}

const populateMessagesMap = () => {
    const success = new Promise((resolve) => {
        const promises = [new Promise((resolve) => { resolve(true)})];
        channels.forEach((channel) => {
            if (isValueInArray(channel.members, getUserId())) {
    
                // TODO: Block continuation until for loop finished?? How??
                promises.push(getMessages(getToken(), channel.id, 0)
                .then((response) => {
                    if (!response) return false;
                    messages.set(channel.id, response.messages);

                    return response;
                }));
            } else {
    
                // Remove messages if now not a channel member
                if (messages.has(channel.id)) {
                    messages.set(channel.id, []);
                }
            }
        });

        resolve(Promise.all(promises));
    });

    return success;
}

const populateAllUsersMap = () => {
    const success = getUsers(getToken())
    .then((users) => { 
        if (!users) return false;
        users.users.forEach((user) => {
            allUsers.set(user.id, user);
        });

        return true;
    });

    return success;
}

const populateUserDetailsMap = () => {
    const success =  new Promise((resolve) => {
        const promises = [new Promise((resolve) => { resolve(true)})];
        userDetails.forEach((user, value) => {
            promises.push(getUserDetails(getToken(), value)
            .then((details) => {
                if (!details) return false;
                userDetails.set(value, details);

                return details;
            }));
        });

        resolve(Promise.all(promises));
    });

    return success;
}