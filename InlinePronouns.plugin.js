/**
 * @name InlinePronouns
 * @author Kyle Williams <SuperSonicDiscord1#4751>, DevilBro 
 * @description Show a user's pronouns inline in channels.
 * @version 0.0.1
 * @license GPL-2.0-only
 */

module.exports = (_ => {
	const changeLog = {
		
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		return class InlinePronouns extends Plugin {
			onLoad () {
				this.defaults = {
					general: {
						useOtherStyle:		{value: false, 	description: "Uses BotTag Style instead of the Role Style"},
						useBlackFont:		{value: false, 	description: "Uses black Font instead of darkening the Color for BotTag Style on bright Colors"},
					},
				};
				
				this.modulePatches = {
					before: [
						"MessageHeader"
					]
				}
				
				this.patchPriority = 4;
				
				this.css = `
					${BDFDB.dotCNS.member + BDFDB.dotCN.namecontainercontent} {
						overflow: visible;
					}
					${BDFDB.dotCN._toproleseverywheretag} {
						display: inline-flex;
						flex: 0 1 auto;
						cursor: pointer;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					${BDFDB.dotCN._toproleseverywheremembertag} {
						max-width: 50%;
					}
					${BDFDB.dotCNS.themelight + BDFDB.dotCN._toproleseverywhererolestyle} {
						color: rgba(79, 84, 92, 0.8);
					}
					${BDFDB.dotCNS.themedark + BDFDB.dotCN._toproleseverywhererolestyle} {
						color: hsla(0, 0%, 100%, 0.8);
					}
					${BDFDB.dotCNS.messagerepliedmessage + BDFDB.dotCN._toproleseverywhererolestyle},
					${BDFDB.dotCNS.messagecompact + BDFDB.dotCN._toproleseverywhererolestyle} {
						margin-right: 0.3rem;
						margin-left: 0;
						text-indent: 0;
					}
					${BDFDB.dotCN._toproleseverywhererolestyle} {
						display: inline-flex;
						margin: 0 0 0 0.3rem;
					}
					${BDFDB.dotCNS._toproleseverywhererolestyle + BDFDB.dotCN.userrolecircle} {
						flex: 0 0 auto;
					}
				`;
			}
			
			onStart () {
				this.forceUpdateAll();
			}
			
			onStop () {
				this.forceUpdateAll();
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel, settingsItems = [];
				
				for (let key in this.defaults.general) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
					type: "Switch",
					plugin: this,
					keys: ["general", key],
					label: this.defaults.general[key].description,
					value: this.settings.general[key]
				}));
				
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
			}

			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					this.forceUpdateAll();
				}
			}
	
			forceUpdateAll () {
				BDFDB.PatchUtils.forceAllUpdates(this);
				BDFDB.MessageUtils.rerenderAll();
			}

			processMessageHeader (e) {
				if (!e.instance.props.message) return;

				let [children, index] = BDFDB.ReactUtils.findParent(e.instance.props.username, {filter: n => n && n.props && typeof n.props.renderPopout == "function"});
				if (index == -1) return;
				const author = e.instance.props.userOverride || e.instance.props.message.author;
				
				this.injectRoleTag(children, author, "chat", e.instance.props.compact ? index : (index + 2), {
					tagClass: e.instance.props.compact ? BDFDB.disCN.messagebottagcompact : BDFDB.disCN.messagebottagcozy,
					useRem: true
				});
			}

			injectRoleTag (children, user, type, insertIndex, config = {}) {
				if (!BDFDB.ArrayUtils.is(children) || !user) return;
				let guild = BDFDB.LibraryStores.GuildStore.getGuild(BDFDB.LibraryStores.SelectedGuildStore.getGuildId());
				// Computer programs don't have pronouns.
				// At least, not yet.
				if (!guild || user.bot) return;

				const member = BDFDB.LibraryStores.GuildMemberStore.getMember(guild.id, user.id)
				const pronounRoles = Object.values(guild.roles).filter(role =>
					["he/him", "she/her", "they/them", "ask for pronouns", "any pronouns"].includes(role.name)
				)
				const memberPronounRoles = pronounRoles.filter(role => member.roles.includes(role.id)),
					role = memberPronounRoles[0];

				if (role) children.splice(insertIndex, 0, this.createTag(role, type, config));
			}
			
			createTag (role, type, config = {}) {
				if (this.settings.general.useOtherStyle) {
					let tagColor = BDFDB.ColorUtils.convert(role.colorString || BDFDB.DiscordConstants.Colors.PRIMARY_500, "RGB")
					let isBright = role.colorString && BDFDB.ColorUtils.isBright(tagColor);
					tagColor = isBright ? (this.settings.general.useBlackFont ? tagColor : BDFDB.ColorUtils.change(tagColor, -0.3)) : tagColor;
					return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.BotTag, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._toproleseverywheretag, BDFDB.disCN[`_toproleseverywhere${type}tag`], BDFDB.disCN._toproleseverywherebadgestyle, config.tagClass),
						useRemSizes: config.useRem,
						invertColor: config.inverted,
						style: {
							backgroundColor: tagColor,
							color: isBright && this.settings.general.useBlackFont ? "black" : null
						},
						tag: role.name,
						onContextMenu: role.id ? event => this.openRoleContextMenu(event, role) : null
					});
				}
				else return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MemberRole, {
					className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._toproleseverywheretag, BDFDB.disCN[`_toproleseverywhere${type}tag`], BDFDB.disCN._toproleseverywhererolestyle),
					role: role,
					onContextMenu: role.id ? event => this.openRoleContextMenu(event, role) : null
				});
			}
			
			openRoleContextMenu (event, role) {
				BDFDB.LibraryModules.ContextMenuUtils.openContextMenu(event, e => BDFDB.ReactUtils.createElement(BDFDB.ModuleUtils.findByName("DeveloperContextMenu"), Object.assign({}, e, {id: role.id})));
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();