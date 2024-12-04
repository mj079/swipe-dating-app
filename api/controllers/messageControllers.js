const Message = require('../models/Message');
const { getConnectedUsers, getIO } = require('../socket/socket.server')

const sendMessage = async (req, res) => {
    try {
        const { content, receiverId } = req.body;

        const newMessage = await Message.create({
            sender: req.user.id,
            receiver: receiverId,
            content,
        });

        const io = getIO();
		const connectedUsers = getConnectedUsers();
		const receiverSocketId = connectedUsers.get(receiverId);

		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", {
				message: newMessage,
			});
		}

        res.status(200).json({
            success: true,
            message: newMessage
        })
    } catch (error) {
        console.log("Error in sendMessage: ", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
};

const getConversation = async (req, res) => {
    const { userId } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        }).sort("createdAt");

        if(!messages) {
            res.json({
                message: "No messages yet"
            })
        }

        res.status(200).json({
            success: true,
            messages
        })
    } catch (error) {
        console.log("Error in getConversation: ", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
};

module.exports = {
    sendMessage,
    getConversation
}