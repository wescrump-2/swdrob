import OBR, {Image, isImage} from "@owlbear-rodeo/sdk";

export class Debug {
	private static _enabled = false;
	private static wasEnabled = false;

	static get enabled() {
		return this._enabled;
	}
		static set enabled(flag:boolean) {
		this._enabled=flag;
	}
    static async   sceneOnChange() {
    const isReady = await OBR.scene.isReady();
    if (isReady) {
        Debug.log("Scene is ready, executing scene-dependent code");
        const initialItems = await OBR.scene.items.getItems((item): item is Image => item.layer === "CHARACTER" && isImage(item));
        Debug.updateFromPlayers(initialItems.map(i => i.name))
        Debug.log(`Scene ready - found ${initialItems.length} character items`);
    } else {
        Debug.log("Scene is not ready, skipping scene-dependent code");
    }
}
	static updateFromPlayers(names: string[]) {
	    const hasDebugPlayer = names.some(p =>
	        p.toLowerCase().includes("debug")
	    );
	    if (hasDebugPlayer !== this._enabled) {
	        this._enabled = hasDebugPlayer;

	        if (hasDebugPlayer && !this.wasEnabled) {
	            console.log(
	                "%cINITIATIVE DEBUG MODE ACTIVATED — 'debug' player in room.'",
	                "color: lime; background: #000; font-weight: bold; font-size: 16px; padding: 8px 12px; border-radius: 4px;"
	            );
	        }
	        if (!hasDebugPlayer && this.wasEnabled) {
	            console.log(
	                "%cINITIATIVE DEBUG MODE DEACTIVATED — no 'debug' player in room.",
	                "color: red; background: #000; font-weight: bold; font-size: 16px; padding: 8px 12px; border-radius: 4px;"
	            );
	        }
	        this.wasEnabled = hasDebugPlayer;
	    } else {
	        console.log(`No change needed - hasDebugPlayer: ${hasDebugPlayer}, _enabled: ${this._enabled}`);
	    }
	}

	// Method to manually enable debug mode for testing
	static enableDebugMode() {
		if (!this._enabled) {
			this._enabled = true;
			this.wasEnabled = true;
		}
	}

	static log(...args: any[]) {
		if (this._enabled) {
			console.log(...args);
		}
	}

	static warn(...args: any[]) {
		if (this._enabled) {
			console.warn(...args);
		}
	}

	static error(...args: any[]) {
		if (this._enabled) {
			console.error(...args);
		}
	}



	// --- List ALL room metadata keys and their sizes ---
	static async dumpRoomMetadata() {
		if (!Debug.enabled) return;
		const meta = await OBR.room.getMetadata();
		Debug.log("=== ROOM METADATA ===");
		for (const [key, value] of Object.entries(meta)) {
			const size = Debug.getObjectMemorySize(value);
			Debug.log(`${key}  →  ${size} bytes`, value);
		}
	}

	// --- List ALL extensions that have stored something on scene items ---
	static async findItemMetadataKeys() {
		if (!Debug.enabled) return;
		const items = await OBR.scene.items.getItems();
		const keys = new Set();
		items.forEach(item => {
			if (item.metadata) {
				Object.keys(item.metadata).forEach(k => keys.add(k));
			}
		});
		Debug.log("=== METADATA KEYS FOUND ON SCENE ITEMS ===");
		Debug.log(Array.from(keys).sort());
	}

	/**
	 * Improved cleanup: Deletes keys by setting them to null individually (reliable removal).
	 * Retries on failure and checks total size to avoid 16 kB errors.
	 */
	static async cleanupDeadExtensionMetadata() {
		if (!Debug.enabled) return;
		try {
			const roomMetadata = await OBR.room.getMetadata();

			// Log current size for debugging
			let currentSize = 0;
			for (const [value] of Object.entries(roomMetadata)) {
				currentSize += Debug.getObjectMemorySize(value);
			}
			Debug.log(`Current room metadata size: ${currentSize} bytes`);

			if (currentSize > 16000) {  // Close to limit — abort to avoid write failure
				console.warn("Room metadata too large (>15 kB). Manual room reset needed.");
				return;
			}

			const keysToDelete: string[] = [];
			const activeIds: string[] = [
				"com.battle-system.mark/metadata_marks",
				"com.battle-system.ticker",
				"com.wescrump.dice-roller/player/rollHistory",
				"com.battle-system.chronicle",
				// Add more prefixes here as needed
			];

			// Find keys matching active (conflicting) prefixes
			for (const prefix of activeIds) {
				const matchingKey = Object.keys(roomMetadata).find(k => k.startsWith(prefix));
				if (matchingKey) {
					keysToDelete.push(matchingKey);
				}
			}

			if (keysToDelete.length === 0) {
				Debug.log("No conflicting keys found.");
				return;
			}

			Debug.log(`Found ${keysToDelete.length} conflicting keys:`, keysToDelete);

			// Delete each key individually by setting to null (reliable method)
			let successCount = 0;
			for (const key of keysToDelete) {
				try {
					await OBR.room.setMetadata({ [key]: undefined });
					successCount++;
					Debug.log(`Deleted key: ${key}`);
				} catch (deleteErr: unknown) {
					console.error(`Failed to delete ${key}:`, deleteErr);
					// Optional: Retry once after delay
					setTimeout(async () => {
						try {
							await OBR.room.setMetadata({ [key]: undefined });
							Debug.log(`Retried and deleted: ${key}`);
						} catch (retryErr) {
							console.error(`Retry failed for ${key}:`, retryErr);
						}
					}, 500);
				}
			}

			Debug.log(`Cleanup complete: ${successCount}/${keysToDelete.length} keys deleted.`);

			// Final size check
			const newMetadata = await OBR.room.getMetadata();
			let newSize = 0;
			for (const [value] of Object.entries(newMetadata)) {
				newSize += Debug.getObjectMemorySize(value);
			}
			Debug.log(`New room metadata size: ${newSize} bytes (reduced by ${currentSize - newSize} bytes)`);

			// Clean scene item metadata
			const items = await OBR.scene.items.getItems();
			const itemsToUpdate: { id: string; metadata: any }[] = [];
			for (const item of items) {
				if (item.metadata) {
					const keysToDelete = Object.keys(item.metadata).filter(key => activeIds.some(prefix => key.startsWith(prefix)));
					if (keysToDelete.length > 0) {
						const updatedMetadata = { ...item.metadata };
						for (const key of keysToDelete) {
							delete updatedMetadata[key];
						}
						itemsToUpdate.push({ id: item.id, metadata: updatedMetadata });
						Debug.log(`Will clean metadata on item ${item.id}: ${keysToDelete.join(', ')}`);
					}
				}
			}
			if (itemsToUpdate.length > 0) {
				const metadataMap = new Map(itemsToUpdate.map(i => [i.id, i.metadata]));
				await OBR.scene.items.updateItems(Array.from(metadataMap.keys()), (item: any) => ({ metadata: metadataMap.get(item.id)! }));
				Debug.log(`Cleaned metadata on ${itemsToUpdate.length} scene items.`);
			} else {
				Debug.log("No scene items with conflicting metadata found.");
			}

		} catch (err: unknown) {
			console.error("Overall cleanup failed (safe to ignore):", err);
		}
	}

	/**
	 * Approximate the memory size of an object in bytes.
	 */
	static getObjectMemorySize(obj: any): number {
		if (obj instanceof Uint8Array) {
			return obj.byteLength;
		}
		const type = typeof obj;
		if (type === 'string') {
			return obj.length * 2; // UTF-16
		} else if (type === 'number') {
			return 8;
		} else if (type === 'boolean') {
			return 4;
		} else if (obj === null || obj === undefined) {
			return 0;
		} else if (Array.isArray(obj)) {
			let size = 16; // array overhead
			for (const item of obj) {
				size += Debug.getObjectMemorySize(item);
			}
			return size;
		} else if (type === 'object') {
			let size = 16; // object overhead
			for (const key in obj) {
				size += key.length * 2 + 8; // key + pointer
				size += Debug.getObjectMemorySize(obj[key]);
			}
			return size;
		}
		return 0;
	}
}// end Debug