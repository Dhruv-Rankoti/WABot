class TagEveryone {
    #socket;
    #getText;
    #sendMessage;
    #membersLimit;
    #triggerAll;
    #triggerAdmins;
    #triggerMembers;
  
    constructor(config = {}) {
      this.#membersLimit = config.membersLimit || 100;
      this.#triggerAll = config.triggerAll || "all";
      this.#triggerAdmins = config.triggerAdmins;
      this.#triggerMembers = config.triggerMembers;
    }
  
    init(socket, getText, sendMessage) {
      this.#socket = socket;
      this.#getText = getText;
      this.#sendMessage = sendMessage;
    }
  
    async process(key, message) {
      const text = this.#getText(key, message);
      const tagAll = text.includes("!" + this.#triggerAll)
      const tagAdmins = text.includes("!" + this.#triggerAdmins)
      const tagMembers = text.includes("!" + this.#triggerMembers)

      if (!tagAll && !tagAdmins && !tagMembers) return;
  
      try {
        const grp = await this.#socket.groupMetadata(key.remoteJid);
        const members = grp.participants;

        const senderId = key.participant;
        const senderIsAdmin = members.some(member => member.id === senderId && member.admin);

        // if (!senderIsAdmin && !key.fromMe) return;
        if (!key.fromMe) return;
  
        const mentions = [];
        const items = [];
  
        members.forEach(({ id, admin }) => {
          if (tagAll) {
            mentions.push(id);
            items.push("@" + id.slice(0, 12) + (admin ? " 🗿 " : ""));
          } else if (tagAdmins && admin) {
            mentions.push(id);
            items.push("@" + id.slice(0, 12));
          } else if (tagMembers && !admin) {
            mentions.push(id);
            items.push("@" + id.slice(0, 12));
          }
        });
  
        if (members.length < this.#membersLimit)
          this.#sendMessage(
            key.remoteJid,
            { text: `[tagging...] ${items.join(", ")}`, mentions },
            { quoted: { key, message } }
          );
      } catch (err) {
        console.log("ERROR in TagEveryone:", err);
      }
    }
  }
  
  module.exports = TagEveryone;