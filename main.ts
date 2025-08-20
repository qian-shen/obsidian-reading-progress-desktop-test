import {
	Plugin,
	Platform
} from "obsidian";
import { ReadingProgress } from "ReadingProgress";

interface ReadingProgressSettings {
    showFullscreenButton: boolean,
    showViewType: boolean
}

const DEFAULT_SETTINGS: ReadingProgressSettings = {
    showFullscreenButton: true,
    showViewType: true
}

export default class ReadingProgressStatusBarPlugin extends Plugin {
	rp: ReadingProgress;
	st: ReadingProgressSettings;
	async onload() {
		if (!Platform.isDesktopApp) {
			return;
		}

		await this.loadSettings()

		this.rp = new ReadingProgress(this);
		this.rp.initReadingProgress();
	}

	
	// 加载配置的方法
    async loadSettings() {
        this.st = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // 保存配置的方法
    async saveSettings() {
        await this.saveData(this.st);
    }

	onunload() {
		this.rp.unload();
	}
}
