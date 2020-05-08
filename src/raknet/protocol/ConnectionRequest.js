const Packet = require("./Packet");
const MessageIdentifiers = require("./MessageIdentifiers");

class ConnectionRequest extends Packet {
    static ID = MessageIdentifiers.ID_CONNECTION_REQUEST;

    clientId;
    sendPingTime = 0;
    useSecurity = false;

    encodePayload() {
        this.writeLong(this.clientId);
        this.writeLong(this.sendPingTime);
        this.writeBool(this.useSecurity);
    }

    decodePayload() {
        this.clientId = this.readLong();
        this.sendPingTime = this.readLong();
        this.useSecurity = this.readBool();
    }
}

module.exports = ConnectionRequest;