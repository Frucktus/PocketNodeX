// const UUID = require("../utils/UUID");
const PlayerSessionAdapter = require("../network/PlayerNetworkSessionAdapter");
// const Level = require("../level/Level");
const PlayerPreLoginEvent = require("../event/player/PlayerPreLoginEvent");
const PlayerJoinEvent = require("../event/player/PlayerJoinEvent");

//const SetEntityDataPacket = require("network/mcpe/protocol/SetEntityDataPacket");

const BiomeDefinitionListPacket = require("../network/mcpe/protocol/BiomeDefinitionListPacket");
const AvailableEntityIdentifiersPacket = require("../network/mcpe/protocol/AvailableEntityIdentifiersPacket");

const PlayerJumpEvent = require("../event/player/PlayerJumpEvent");
const PlayerAnimationEvent = require("../event/player/PlayerAnimationEvent");
const PlayerInteractEvent = require("../event/player/PlayerInteractEvent");

//const EventManager = require("event/EventManager");
const AttributeMap = require("../entity/AttributeMap");

const ResourcePackClientResponsePacket = require("../network/mcpe/protocol/ResourcePackClientResponsePacket");
const ResourcePackDataInfoPacket = require("../network/mcpe/protocol/ResourcePackDataInfoPacket");
const ResourcePackStackPacket = require("../network/mcpe/protocol/ResourcePackStackPacket");
// const ResourcePackChunkRequestPacket = pocketnode("network/mcpe/protocol/ResourcePackChunkRequestPacket");

const DataPacket = require("../network/mcpe/protocol/DataPacket");
// const BatchPacket = require("../network/mcpe/protocol/BatchPacket");
const AnimatePacket = require("../network/mcpe/protocol/AnimatePacket");
const InteractPacket = require("../network/mcpe/protocol/InteractPacket");
const PlayerActionPacket = require("../network/mcpe/protocol/PlayerActionPacket");
const LoginPacket = require("../network/mcpe/protocol/LoginPacket");
const PlayStatusPacket = require("../network/mcpe/protocol/PlayStatusPacket");
const UpdateAttributesPacket = require("../network/mcpe/protocol/UpdateAttributesPacket");
// const PlayerPreLoginEvent = require("event/player/PlayerPreLoginEvent");
const DisconnectPacket = require("../network/mcpe/protocol/DisconnectPacket");
const MovePlayerPacket = require("../network/mcpe/protocol/MovePlayerPacket");
const ResourcePacksInfoPacket = require("../network/mcpe/protocol/ResourcePacksInfoPacket");
const StartGamePacket = require("../network/mcpe/protocol/StartGamePacket");
const ChunkRadiusUpdatedPacket = require("../network/mcpe/protocol/ChunkRadiusUpdatedPacket");
const TextPacket = require("../network/mcpe/protocol/TextPacket");
const LevelChunkPacket =  require("../network/mcpe/protocol/LevelChunkPacket");
const SetPlayerGameTypePacket =  require("../network/mcpe/protocol/SetPlayerGameTypePacket");
const AvailableCommandsPacket = require("../network/mcpe/protocol/AvailableCommandsPacket");

const DataPacketSendEvent = require("../event/server/DataPacketSendEvent");

const GameRule = require("../level/GameRule");
const AxisAlignedBB = require("../math/AxisAlignedBB");

const CommandData = require("../network/mcpe/protocol/types/CommandData");
const CommandParameter = require("../network/mcpe/protocol/types/CommandParameter");
const CommandEnum = require("../network/mcpe/protocol/types/CommandEnum");

const Vector3 = require("../math/Vector3");

const Isset = require("../utils/methods/Isset");

const Human = require("../entity/Human");
const Skin = require("../entity/Skin");
// const Position = require("../level/Position");

const CompoundTag = require("../nbt/tag/CompoundTag");
const ResourcePack = require("../resourcepacks/ResourcePack");
const TextFormat = require("../utils/TextFormat");
const Base64 = require("../utils/Base64");

// const Async = require("../utils/Async");

class Player extends Human{
    static get SURVIVAL(){return 0}
    static get CREATIVE(){return 1}
    static get ADVENTURE(){return 2}
    static get SPECTATOR(){return 3}
    static get VIEW(){return Player.SPECTATOR}

    initVars(){
        this._sessionAdapter = null;

        this.playedBefore = false;
        this.spawned = false;
        this.loggedIn = false;
        this.joined = false;
        this.closed = false;
        this.gamemode = 0;

        this.attributeMap = new AttributeMap();

        this._authenticated = false;
        this._xuid = "";

        this.speed = null;

        this.creationTime = 0;

        this._randomClientId = 0;

        this._ip = "";
        this._port = 0;
        this._username = "";
        this._iusername = "";
        this._displayName = "";
        this._clientId = null;
        this.locale = "";
        this._uuid = "";
        this._rawUUID = "";

        this._pitch = 0;
        this._boundingBox = new AxisAlignedBB();
        this._yaw = 0;

        this._viewDistance = -1;

        this._skin = {};

        this._needACK = {};

        this.onGround = false;

        this.usedChunks = [];
    }
    
    constructor(server, clientId, ip, port){
        super(null, new CompoundTag());
        this.initVars();
        this.server = server;
        this._clientId = clientId;
        this._ip = ip;
        this._port = port;
        this.creationTime = Date.now();

        this.namedtag = new CompoundTag();
        this._boundingBox = new AxisAlignedBB(0, 0, 0, 0, 0, 0, 0);

        this._uuid = null;
        this._rawUUID = null;

        //TODO: this.onGround = this.namedtag.getByte("onGround", 0) !== 0;

        this._sessionAdapter = new PlayerSessionAdapter(this);
        this.lastUpdate = this.server.getTick();

        //Entity.constructor.call(this.level, this.namedtag);
    }

    getLeaveMessage(){
        if(this.joined){
            return TextFormat.YELLOW + this.getName() + " has left the game";
        }
        return "";
    }

    isConnected(){
        return this._sessionAdapter !== null;
    }
    
    static isValidUserName(name){

        if (name == null){
            return false;
        }

        return name.toLowerCase() !== "rcon" && name.toLowerCase() !== "console" && name.length >= 1 && name.length <= 16 && /[^A-Za-z0-9_ ]/.test(name);
    }

    isAuthenticated(){
        return this._xuid !== "";
    }

    getXuid(){
        return this._xuid;
    }

    hasPlayedBefore(){
        return this.playedBefore;
    }

    getName(){
        return this._username;
    }

    getLowerCaseName(){
        return this._iusername;
    }

    getAddress(){
        return this._ip;
    }

    getPort(){
        return this._port;
    }

    handleLogin(packet) {
        CheckTypes([LoginPacket, packet]);

        if (this.loggedIn) {
            return false;
        }

        /*if(packet.protocol] !== mcpeInfo.PROTOCOL){
            if(packet.protocol < mcpeInfo.PROTOCOL){
                this.sendPlayStatus(PlayStatusPacket.LOGIN_FAILED_CLIENT, true);
            }else{
                this.sendPlayStatus(PlayStatusPacket.LOGIN_FAILED_SERVER, true);
            }

            this.close("", "Incompatible Protocol", false);

            return true;
        }*/

        /*if (Player.isValidUserName(packet.username)) {
            this.close("", "Invalid Username");
            return true;
        }*/

        this._username = TextFormat.clean(packet.username);
        this._displayName = this._username;
        this._iusername = this._username.toLowerCase();

        if (packet.locale !== null){
            this.locale = packet.locale;
        }

        if (this.server.isFull() && this.kick("Server Full", false)){
            return true;
        }

        this._randomClientId = packet.clientId;

        //this._uuid = UUID.fromString(packet.clientUUID);
        //this._rawUUID = this._uuid.toBinary();

        let skin = new Skin(
            packet.clientData["SkinId"],
            Base64.decode(packet.clientData["SkinData"] ? packet.clientData["SkinData"] : ""),
            Base64.decode(packet.clientData["CapeData"] ? packet.clientData["CapeData"] : ""),
            packet.clientData["SkinGeometryName"],
            Base64.decode(packet.clientData["SkinGeometry"] ? packet.clientData["SkinGeometry"] : "")
        );

        if(!skin.isValid()){
            this.close("", "Invalid Skin");
            return true;
        }

        this._skin = skin; //todo: function setSkin()

        let ev = new PlayerPreLoginEvent(this, "Test");
        this.server.getPluginManager().callEvent(ev);
        
        if (ev.isCancelled()) {
             this.close("", ev.getKickMessage());
             return true;
         }

        //this.server._whitelist
        //todo: if whitelisted/banned kick

        if (!packet.skipVerification){
            //todo: transfer code here from async comment
            this.onVerifyCompleted(packet, null, true); //todo: momentanely fix
        }else{
            this.onVerifyCompleted(packet, null, true);
        }

        return true;
    }

    doFirstSpawn(){
        this.spawned = true;

        this.sendPlayStatus(PlayStatusPacket.PLAYER_SPAWN);

        let ev = new PlayerJoinEvent(this, "test");
        this.server.getPluginManager().callEvent(ev);

        if (ev.getJoinMessage().length > 0){
            this.server.broadcastMessage(ev.getJoinMessage());
        }

        this.noDamageTicks = 60;
    }


    onVerifyCompleted(packet, error, signedByMojang){
        if(this.closed) return;
        
        if (error !== null) {
            this.close("", "Invalid Session");
            return;
        }

        let xuid = packet.xuid;
        
        if (!signedByMojang && xuid !== "") {
            this.server.getLogger().info(this.getName() + " has an XUID, but their login keychain is not signed by Mojang");
            xuid = "";
        }
        
        if (xuid === "" || !xuid instanceof String){
            if (signedByMojang){
                this.server.getLogger().error(this.getName() + " should have an XUID, but none found");
            }

            if(this.server.requiresAuthentication() && this.kick("This server requires authentication.", false)){
                return;
            }

            this.server.getLogger().debug(this.getName() + " is NOT logged into Xbox Live");
        }else {
            this.server.getLogger().debug(this.getName() + " is logged into Xbox Live");
            this._xuid = xuid;
        }

        //TODO: encryption

        this._processLogin();
    }

    _processLogin(){
        for(let [,p] of this.server._loggedInPlayers){
            if(p !== this && p._iusername === this._iusername){
                if(p.kick("Logged in from another location") === false){
                    this.close(this.getLeaveMessage(), "Logged in from another location");
                    return;
                }
            }else if(p.loggedIn/* && uuids equal*/){
                if(p.kick("Logged in from another location") === false){
                    this.close(this.getLeaveMessage(), "Logged in from another location");
                    return;
                }
            }
        }

        this.sendPlayStatus(PlayStatusPacket.LOGIN_SUCCESS);

        this.loggedIn = true;
        this.server.onPlayerLogin(this);
        console.log("Player logged in: "+this._username);

        let pk = new ResourcePacksInfoPacket();
        let manager = this.server.getResourcePackManager();
        pk.resourcePackEntries = manager.getResourcePacks();
        pk.mustAccept = manager.resourcePacksRequired();
        this.dataPacket(pk);
    }

    sendPlayStatus(status, immediate = false){
        let pk = new PlayStatusPacket();
        pk.status = status;
        //pk.protocol = this._protocol;
        if(immediate){
            this.directDataPacket(pk);
        }else{
            this.dataPacket(pk);
        }
    }

    /**
     *
     * @param skin {Skin}
     * @param newSkinName {string}
     * @param oldSkinName {string}
     */
    changeSkin(skin, newSkinName, oldSkinName){
        if (!skin.isValid()){
            return false;
        }

        //TODO: finish handle
    }

    dataPacket(packet, needACK = false){
        return this.sendDataPacket(packet, needACK, false);
    }

    directDataPacket(packet, needACK = false){
        return this.sendDataPacket(packet, needACK, true);
    }

    sendDataPacket(packet, needACK = false, immediate = false){
        CheckTypes([DataPacket, packet], [Boolean, needACK], [Boolean, immediate]);
        if(!this.isConnected()) return false;

        if(!this.loggedIn && !packet.canBeSentBeforeLogin()){
            throw new Error("Attempted to send "+packet.getName()+" to "+this.getName()+" before they got logged in.");
        }

        let ev = new DataPacketSendEvent(this, packet);
        this.server.getPluginManager().callEvent(ev);
        if(ev.isCancelled()){
            return false;
        }

        let identifier = this.getSessionAdapter().sendPacket(packet, needACK, immediate);

        if(needACK && identifier !== null){
            this._needACK[identifier] = false;
            return identifier;
        }

        return true;
    }

    kick(reason = "", isAdmin = true){
        let message;
        if(isAdmin){
            if(true){//todo: not is banned
                message = "Kicked by admin." + (reason !== "" ? " Reason: " + reason : "");
            }else{
                message = reason;
            }
        }else{
            if(reason === ""){
                message = "Unknown Reason.";
            }else{
                message = reason;
            }
        }

        this.close(reason, message);
    }

    close(message, reason = "generic reason", notify = true){
        if(this.isConnected() && !this.closed){
            try{
                if(notify && reason.length > 0){
                    let pk = new DisconnectPacket();
                    pk.message = reason;
                    this.directDataPacket(pk);
                }

                this._sessionAdapter = null;

                //unsub from perms?
                //stopsleep

                if(this.joined){
                    try{
                        //save player data
                    }catch(e){
                        this.server.getLogger().error("Failed to save player data for "+this.getName());
                        this.server.getLogger().logError(e);
                    }

                    //tell server player left the game
                }
                this.joined = false;

                //if valid do chuck stuff

                if(this.loggedIn){
                    this.server.onPlayerLogout(this);
                    //can see etc
                }

                this.spawned = false;

                this.server.getLogger().info(TextFormat.AQUA + this.getName() + TextFormat.WHITE + " (" + this._ip + ":" + this._port + ") has disconnected due to " + reason);

                if(this.loggedIn){
                    this.loggedIn = false;
                    this.server.removeOnlinePlayer(this);
                }
            }catch(e){
                this.server.getLogger().logError(e);
            }finally{
                this.server.getRakNetAdapter().close(this, notify ? reason : "");
                this.server.removePlayer(this);
            }
        }
    }

    setViewDistance(distance){
        this._viewDistance = distance;

        let pk = new ChunkRadiusUpdatedPacket();
        pk.radius = this._viewDistance;
        this.dataPacket(pk);

        console.log("Setting view distance for " + this.getName() + " to " + distance);
    }

    getViewDistance(){
        return this._viewDistance;
    }

    completeLoginSequence(){

        //let pos = this.namedtag.getListTag("Pos").getAllValues();
        //this.usedChunks[Level.chunkHash(pos[0] >> 4, pos[2]) >> 4] = false;

        //create entity
        this.server.getLogger().info([
            TextFormat.AQUA + this.getName() + TextFormat.WHITE + " (" + this._ip + ":" + this._port + ")",
            "is attempting to join"
        ].join(" "));

        let pk = new StartGamePacket();
        pk.entityUniqueId = this.id;
        pk.entityRuntimeId = this.id;
        pk.playerGamemode = Player.getClientFriendlyGamemode(this.gamemode);

        pk.playerPosition = new Vector3(0, 5.5, 0);

        pk.pitch = this._pitch;
        pk.yaw = this._yaw;
        pk.seed = 0xdeadbeef;
        pk.dimension = 0; //TODO
        pk.levelGamemode = this.server.getGamemode();
        pk.difficulty = 1; //TODO
        [pk.spawnX, pk.spawnY, pk.spawnZ] = [0, 6.5, 0];
        pk.hasAchievementsDisabled = true;
        pk.time = 0;
        pk.eduMode = false;
        pk.rainLevel = 0;
        pk.lightningLevel = 0;
        pk.commandsEnabled = true;
        pk.levelId = "";
        pk.levelName = this.server.getMotd();
        pk.gameRules = [
            new GameRule(GameRule.COMMAND_BLOCK_OUTPUT, true),
            new GameRule(GameRule.DO_DAYLIGHT_CYCLE, true),
            new GameRule(GameRule.DO_ENTITY_DROPS, true),
            new GameRule(GameRule.DO_FIRE_TICK, true),
            new GameRule(GameRule.DO_MOB_LOOT, true),
            new GameRule(GameRule.DO_MOB_SPAWNING, true),
            new GameRule(GameRule.DO_TILE_DROPS, true),
            new GameRule(GameRule.DO_WEATHER_CYCLE, true),
            new GameRule(GameRule.DROWNING_DAMAGE, true),
            new GameRule(GameRule.FALL_DAMAGE, true),
            new GameRule(GameRule.FIRE_DAMAGE, true),
            new GameRule(GameRule.KEEP_INVENTORY, false),
            new GameRule(GameRule.MOB_GRIEFING, true),
            new GameRule(GameRule.NATURAL_REGENERATION, true),
            new GameRule(GameRule.PVP, true),
            new GameRule(GameRule.SEND_COMMAND_FEEDBACK, true),
            new GameRule(GameRule.SHOW_COORDINATES, true),
            new GameRule(GameRule.RANDOM_TICK_SPEED, 3),
            new GameRule(GameRule.TNT_EXPLODES, true)
        ];
        this.dataPacket(pk);

        this.sendDataPacket(new AvailableEntityIdentifiersPacket());
        this.sendDataPacket(new BiomeDefinitionListPacket());

        /*pk.generator = 2;
        pk.levelGamemode = 1;

        pk.isMultiplayerGame = true;
        pk.hasXboxLiveBroadcast = false;
        pk.hasLANBroadcast = true;
        pk.commandsEnabled = true;
        pk.gameRules = [];
        pk.hasBonusChestEnabled = false;
        pk.hasStartWithMapEnabled = false;
        pk.hasTrustPlayersEnabled = true;
        pk.xboxLiveBroadcastMode = 0;
        pk.currentTick = this.server.getCurrentTick();
        pk.enchantmentSeed = 123456;
        pk.time = 0;
        pk.hasAchievementsDisabled = true;
        //pk.gameRules = this.getServer().getDefaultLevel().getGameRules();
        pk.gameRules = [
            new GameRule(GameRule.COMMAND_BLOCK_OUTPUT, true),
            new GameRule(GameRule.DO_DAYLIGHT_CYCLE, true),
            new GameRule(GameRule.DO_ENTITY_DROPS, true),
            new GameRule(GameRule.DO_FIRE_TICK, true),
            new GameRule(GameRule.DO_MOB_LOOT, true),
            new GameRule(GameRule.DO_MOB_SPAWNING, true),
            new GameRule(GameRule.DO_TILE_DROPS, true),
            new GameRule(GameRule.DO_WEATHER_CYCLE, true),
            new GameRule(GameRule.DROWNING_DAMAGE, true),
            new GameRule(GameRule.FALL_DAMAGE, true),
            new GameRule(GameRule.FIRE_DAMAGE, true),
            new GameRule(GameRule.KEEP_INVENTORY, false),
            new GameRule(GameRule.MOB_GRIEFING, true),
            new GameRule(GameRule.NATURAL_REGENERATION, true),
            new GameRule(GameRule.PVP, true),
            new GameRule(GameRule.SEND_COMMAND_FEEDBACK, true),
            new GameRule(GameRule.SHOW_COORDINATES, true),
            new GameRule(GameRule.RANDOM_TICK_SPEED, 3),
            new GameRule(GameRule.TNT_EXPLODES, true)
        ];
        this.dataPacket(pk);*/

        //this.sendData(this);

        //this.sendAttributes(true);
        this.sendCommandData();

        this.server.addOnlinePlayer(this);
        this.server.onPlayerCompleteLoginSequence(this);
    }

    sendCommandData(){
        let pk = new AvailableCommandsPacket();
        this.server.getCommandMap().getCommands().forEach(command => {
           for (let name in command) {
               if (command.hasOwnProperty(name)) {
                   if (Isset(pk.commandData[command.getName()]) || command.getName() === "help") {
                       continue;
                   }

                   let data = new CommandData();
                   //TODO: commands containing uppercase letters in the name crash 1.9.0 client
                   data.commandName = command.getName().toLowerCase();
                   data.commandDescription = command.getDescription();
                   data.flags = 0;
                   data.permission = 0;

                   let parameter = new CommandParameter();
                   parameter.paramName = "args";
                   parameter.paramType = AvailableCommandsPacket.ARG_FLAG_VALID | AvailableCommandsPacket.ARG_TYPE_RAWTEXT;
                   parameter.isOptional = true;
                   data.overloads[0] = [];
                   data.overloads[0][0] = parameter;

                   let aliases = command.getAliases();
                   if (aliases.length !== 0) {
                       if (aliases.indexOf(data.commandName) === -1) {
                           //work around a client bug which makes the original name not show when aliases are used
                           aliases = data.commandName;
                       }
                       data.aliases = new CommandEnum();
                       data.aliases.enumName = command.getName().charAt(0).toUpperCase() + command.getName().substring(1) + "Aliases";
                       data.aliases.enumValues = aliases;
                   }

                   pk.commandData[command.getName()] = data;
               }
           }
        });

        this.dataPacket(pk);
    }

    chat(message){
        //if(this.spawned === false || !this.isAlive()){
        //    return false;
        //}

        //this.resetCraftingGridType();

        message = TextFormat.clean(message, false);//this._removeFormat);
        
        message = message.split("\n");
        for(let i in message){
            if (message.hasOwnProperty(i)) {
                let messagePart = message[i];
                if (messagePart.trim() !== "" && messagePart.length <= 255) {// && this.messageCounter-- > 0){
                    if (messagePart.startsWith("./")) {
                        messagePart = messagePart.substr(1);
                    }

                    if (messagePart.startsWith("/")) {
                        this.server.getCommandMap().dispatchCommand(this, messagePart.substr(1));
                    } else {
                        let msg = "<:player> :message".replace(":player", this.getName()).replace(":message", messagePart);
                        this.server.getLogger().info(msg);
                        this.server.broadcastMessage(msg);
                    }
                }
            }
        }

        return true;
    }

    handleLevelSoundEvent(packet){
        //this.server.getDefaultLevel().addChunkPacket  //TODO: send packet to all players in chunk radius
        this.dataPacket(packet);
        return true
    }

    handleMovePlayer(packet){
        let newPos = packet.position.subtract(0, this._baseOffset, 0);
        
        /*if (newPos.distanceSquared(this) > 1) {
            this.sendPosition(this, null, null, MovePlayerPacket.MODE_RESET);
        }*/ //TODO

        packet.yaw = Math.fmod(packet.yaw, 360);
        packet.pitch = Math.fmod(packet.pitch, 360);

        if (packet.yaw < 0){
            packet.yaw += 360;
        }

        this.setRotation(packet.yaw, packet.pitch);
        this.newPosition = newPos;
        return true;
    }

    handleAnimate(packet){
        if (this.spawned === false){
            return true;
        }

        console.log("AnimatePacket handled!");

        let ev = new PlayerAnimationEvent(this, packet.action);
        this.server.getPluginManager().callEvent(ev);
        if(ev.isCancelled()){
            return true;
        }

        let pk = new AnimatePacket();
        pk.entityRuntimeId = this.getId();
        pk.action = ev.getAnimationType();
        //TODO: edit method of all players and get just this.getViewers();
        this.server.broadcastPackets(this.server.getOnlinePlayers(), pk);
    }

    handleResourcePackClientResponse(packet){

        console.log("Got a new resource pack response with status: " + packet.status);

        let pk, manager;
        console.log("Status:", ResourcePackClientResponsePacket.STATUS(packet.status));

        switch(packet.status){
            case ResourcePackClientResponsePacket.STATUS_REFUSED:
                this.player.close("", "You must accept resource packs to join this server.", true);
                break;

            case ResourcePackClientResponsePacket.STATUS_SEND_PACKS:
                manager = this.server.getResourcePackManager();

                packet.packIds.forEach(uuid => {
                    //dirty hack for mojang's dirty hack for versions
                    let slitPos = uuid.indexOf("_");
                    if (slitPos !== false){
                        uuid = uuid.slice(uuid, 0, slitPos);
                    }

                    let pack = manager.getPackById(uuid);

                    if (!(pack instanceof ResourcePack)){
                        this.player.close("", "Resource Pack is not on this server", true);
                        console.log("Got a resource pack request for unknown pack with UUID " + uuid + ", available packs: " + manager.getPackIdList().join(", "));
                        return false;
                    }

                    let pk = new ResourcePackDataInfoPacket();
                    pk.packId = pack.getPackId();
                    pk.maxChunkSize = 1048576;
                    pk.chunkCount = Math.ceil(pack.getPackSize() / pk.maxChunkSize);
                    pk.compressedPackSize = pack.getPackSize();
                    pk.sha256 = pack.getSha256();
                    this.dataPacket(pk);
                });

                break;

            case ResourcePackClientResponsePacket.STATUS_HAVE_ALL_PACKS:
                pk = new ResourcePackStackPacket();
                manager = this.server.getResourcePackManager();
                pk.resourcePackStack = manager.getResourcePacks();
                pk.mustAccept = manager.resourcePacksRequired();
                this.dataPacket(pk);
                break;

            case ResourcePackClientResponsePacket.STATUS_COMPLETED:
                this.completeLoginSequence();
                break;

            default:
                return false;
        }
        return true;
    }

    //call every tick
    processMovement(){
        let newPos = this.newPosition;
        //let distanceSquared = newPos.distanceSquared(this);

        //let dx = newPos.getX() - this.newPosition.getX();
        //let dy = newPos.getY() - this.newPosition.getY();
        //let dz = newPos.getZ() - this.newPosition.getZ();

        //this.move(dx, dy, dz);

        this.setPosition(newPos);
    }

    onUpdate(currentTick){

        let tickDiff = currentTick - this.lastUpdate;

        if (tickDiff <= 0){
            return true;
        }

        this.messageCounter = 2;
        this.lastUpdate = currentTick;

        //this.sendAttributes();
        this.processMovement();
        //this.processChunkRrquest();
    }

    sendAttributes(sendAll = false){
        let entries = sendAll ? this.attributeMap.getAll() : this.attributeMap.needSend();

        /*if (entries.length > 0){
            let pk = new UpdateAttributesPacket();
            pk.entityRuntimeId = this.id;
            pk.entries = entries;
            this.dataPacket(pk);
            entries.forEach(entry => {
               entry.markSynchronized();
            });
        }*/

        //TODO: fix Attribute class and call attribute.init to make it working
        let pk = new UpdateAttributesPacket();
        pk.entityRuntimeId = this.id;
        pk.entries = entries;
        this.dataPacket(pk);
        entries.forEach(entry => {
            entry.markSynchronized();
        });
    }

    sendPosition(pos, yaw = null, pitch = null, mode = MovePlayerPacket.MODE_NORMAL, targets = null){
      // let playerYaw = (yaw ?? this._yaw);
       let playerYaw = this._yaw;
      // let playerPitch = (pitch ?? this._pitch);
      let playerPitch = this._pitch;

       let fixedpos = pos + 0.001;

       let pk = new MovePlayerPacket();
       pk.entityRuntimeId = this.getId();
       pk.position = fixedpos;
       pk.pitch = playerPitch;
       pk.yaw = playerYaw;
       pk.headYaw = playerYaw;
       pk.mode = mode;

       if (targets !== null){
           this.server.broadcastPackets(pk, targets);
       }else{
           this.dataPacket(pk);
       }

       this.newPosition = null;
    }

    getId(){
        return this._randomClientId;
    }

    handleSetDefaultGameType(packet){
        return false;
    }

    handleSetPlayerGameType(packet){
        if (packet.gamemode !== this.gamemode) {
            this.sendGameMode();
            this.sendSettings();
        }
    }

    sendGameMode(){
        let pk = new SetPlayerGameTypePacket();
        pk.gamemode = Player.getClientFriendlyGamemode(this.gamemode);
        this.dataPacket(pk);
    }

    sendSettings(){

    }

    static getClientFriendlyGamemode(gamemode){
        gamemode &= 0x03;
        if (gamemode === Player.SPECTATOR) {
            return Player.CREATIVE;
        }

        return gamemode;
    }

    handlePlayerAction(packet){
        if (packet.action === PlayerActionPacket.ACTION_RESPAWN && packet.action === PlayerActionPacket.ACTION_DIMENSION_CHANGE_REQUEST){
            return true;
        }

        packet.entityRuntimeId = this.id; //IDK
        let pos = new Vector3(packet.x, packet.y, packet.z);

        switch(packet.action){
            case PlayerActionPacket.ACTION_START_BREAK:
                if (pos.distanceSquared(this) > 10000) {
                    break;
                }

                let target = this.server.getDefaultLevel().getBlock(pos);

                let ev = new PlayerInteractEvent(this, null, target, packet.face, PlayerInteractEvent.LEFT_CLICK_BLOCK);
                this.server.getPluginManager().callEvent(ev);

            case PlayerActionPacket.ACTION_ABORT_BREAK:
            case PlayerActionPacket.ACTION_STOP_BREAK:
                //todo: broadcast level event
                break;

            case PlayerActionPacket.ACTION_CONTINUE_BREAK:
                break;

            case PlayerActionPacket.ACTION_START_SLEEPING:
                //unused
                break;
            case  PlayerActionPacket.ACTION_STOP_SLEEPING:
                // this.stopSleep();
                break;
            case PlayerActionPacket.ACTION_RESPAWN:
                // todo if ()
                //this.respawn()
                break;
            case PlayerActionPacket.ACTION_JUMP:
                this.jump();
                break;
            case  PlayerActionPacket.ACTION_START_SPRINT:

                console.log("PlayerActionHandler sprint toggled");
                //todo this.toggleSprint(true);
                break;
            case PlayerActionPacket.ACTION_STOP_SPRINT:
                //todo this.toggleSprint(false);
                break;
            case PlayerActionPacket.ACTION_START_SNEAK:
                //todo this.toggleSneak(true)
                break;
            case PlayerActionPacket.ACTION_STOP_SNEAK:
                //todo this.toggleSneak(false)
                break;
            case PlayerActionPacket.ACTION_START_GLIDE:
            case PlayerActionPacket.ACTION_STOP_GLIDE:
                break; //TODO
            case PlayerActionPacket.ACTION_START_SWIMMING:
                break; //TODO
            case PlayerActionPacket.ACTION_STOP_SWIMMING:
                break;
            case PlayerActionPacket.ACTION_INTERACT_BLOCK: //ignored (for now)
                break;
            default:
                console.log("Unhandled/unknown player action type " + packet.action + " from " + this.getName());
                return false;
        }

        //todo setUsingItem(false);
    }

    jump() {
        this.server.getPluginManager(new PlayerJumpEvent(this));
        super.jump();
    }

    handleInteract(packet){

        if (!this.spawned || !this.isAlive()) {

        }

        if (packet.action === InteractPacket.ACTION_MOUSEOVER && packet.target === 0){
            return true;
        }

        //todo this.doCloseInventory();
        //todo finish

        switch (packet.action) {
            case InteractPacket.ACTION_LEAVE_VEHICLE:
            case InteractPacket.ACTION_MOUSEOVER:
                break; //TODO: handle these
            default:
                console.log("Unhandled/unknown interaction type " + packet.action + " from " + this.player.getName());
                return false;
        }
    }

    /*getOffsetPosition(pos){
        
        //let result = this.getOffsetPosition(Vector3);
    }*/

    sendMessage(message){
        let pk = new TextPacket();
        pk.type = TextPacket.TYPE_RAW;
        pk.message = message;
        this.dataPacket(pk);
    }

    sendChunk(chunk){
        let pk = new LevelChunkPacket();
        pk.chunkX = chunk.getX();
        pk.chunkZ = chunk.getZ();
        pk.subChunkCount = chunk.getSubChunkSendCount();
        pk.cacheEnabled = false;
        pk.extraPayload = chunk.toBinary();
        this.dataPacket(pk);
        
        if (this.spawned === false){
            this.doFirstSpawn();
        }
    }
    
    /**
     * @return {PlayerSessionAdapter}
     */
    getSessionAdapter(){
        return this._sessionAdapter;
    }
}

module.exports = Player;
