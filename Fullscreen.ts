import MyReadingProgressPlugin from "main";
import { Notice, setIcon, setTooltip, debounce } from "obsidian";
import { t } from "translations/helper";

type FullscreenChangeCallback = (info: {
	isFullscreen: boolean;
	isManual: boolean;
	isF11: boolean;
}) => void;

export class Fullscreen {
	private isManual = false;
	private isTogglingFullscreen = false; // 新增标志位
	private callbacks: Set<FullscreenChangeCallback> = new Set();
	private iconSpanEl: HTMLElement;
	private debouncedFullscreenChange: () => void;
	statusBarToggleFullscreenButtonEl: HTMLElement;
	plugin: MyReadingProgressPlugin;

	constructor(plugin: MyReadingProgressPlugin) {
		this.plugin = plugin;
		this.statusBarToggleFullscreenButtonEl = this.plugin.addStatusBarItem();
		this.statusBarToggleFullscreenButtonEl.addClass("maximize-minimize");
		if (!this.plugin.st.showFullscreenButton) {
			this.statusBarToggleFullscreenButtonEl.addClass("hidden");
		}
		this.iconSpanEl = this.statusBarToggleFullscreenButtonEl.createEl("span", { cls: "status-bar-item-icon" });
	}

	// 请求全屏
	enterFullscreen = () => {
		if (!document.fullscreenElement) {
			this.isTogglingFullscreen = true;
			document.documentElement.requestFullscreen().then(() => {
				this.isManual = true;
				this.isTogglingFullscreen = false;
				this.notify();
			}).catch(console.error);
		}
	}

	// 退出全屏
	exitFullscreen = () => {
		if (document.exitFullscreen) {
			this.isTogglingFullscreen = true;
			document.exitFullscreen().then(() => {
				this.isManual = true;
				this.isTogglingFullscreen = false;
				this.notify();
			}).catch(console.error);
		}
	}

	// 切换全屏
	toggleFullscreen = () => {
		if (this.isCurrentlyFullscreenViaAPI()) {
			this.exitFullscreen();
		} else {
			this.enterFullscreen();
		}
	}

	// 当前是否是任何形式的全屏
	isFullscreen = (): boolean => {
		// return !!document.fullscreenElement;
		return window.innerHeight === screen.height && window.innerWidth === screen.width;
	}

	// 是否是通过 F11 或系统手动触发的全屏（不是通过 API）
	isF11Fullscreen = (): boolean => {
		return this.isFullscreen() && document.fullscreenElement === null;
	}

	// 内部判断是否是我们调用的 API
	private isCurrentlyFullscreenViaAPI = (): boolean => {
		return document.fullscreenElement !== null;
	}

	// 注册状态变化回调
	onChange = (callback: FullscreenChangeCallback) => {
		this.callbacks.add(callback);
	}

	// 取消注册
	offChange = (callback: FullscreenChangeCallback) => {
		this.callbacks.delete(callback);
	}

	// 通知所有监听器
	private notify = () => {
		const info = {
			isFullscreen: this.isFullscreen(),
			isManual: this.isManual,
			isF11: this.isF11Fullscreen()
		};
		this.callbacks.forEach((cb) => cb(info));
	}

	initFullscreen = () => {
		// 防抖函数初始化（100ms）
		this.debouncedFullscreenChange = debounce(() => {
			this.handleFullscreenChange();
		}, 100);
		if (this.isFullscreen()) {
			setTooltip(this.iconSpanEl, t("Exit fullscreen"), { placement: "top" });
			setIcon(this.iconSpanEl, "minimize");
		} else {
			setTooltip(this.iconSpanEl, t("Enter fullscreen"), { placement: "top" });
			setIcon(this.iconSpanEl, "maximize");
		}
		this.onChange(({ isFullscreen, isManual, isF11 }) => {
			if (isManual) {
				if (isFullscreen) {
					new Notice(t("Enter fullscreen"));
					setTooltip(this.iconSpanEl, t("Exit fullscreen"), { placement: "top" });
					setIcon(this.iconSpanEl, "minimize");
				} else {
					new Notice(t("Exit fullscreen"));
					setTooltip(this.iconSpanEl, t("Enter fullscreen"), { placement: "top" });
					setIcon(this.iconSpanEl, "maximize");
				}
			} else if (isF11) {
				new Notice(t("F11 fullscreen mode"));
				setTooltip(this.iconSpanEl, t("Button is unavailable"), { placement: "top" });
				setIcon(this.iconSpanEl, "ban");
				this.statusBarToggleFullscreenButtonEl.addClass("ban");
			} else {
				new Notice(t("Exit fullscreen"));
				setTooltip(this.iconSpanEl, t("Enter fullscreen"), { placement: "top" });
				setIcon(this.iconSpanEl, "maximize");
				this.statusBarToggleFullscreenButtonEl.removeClass("ban");
			}
		});
		this.statusBarToggleFullscreenButtonEl.addEventListener("click", this.toggleFullscreen);
		window.addEventListener("fullscreenchange", this.debouncedFullscreenChange);
	}

	// 绑定 this 的事件处理器
	private handleFullscreenChange = () => {
		if (!this.isTogglingFullscreen) {
			if (this.isF11Fullscreen()) {
				this.isManual = false;
				this.notify();
			} else if (!this.isManual) {
				this.notify();
			}
		} else {
			return;
		}

	};

	displayChange = (show: boolean) => {
		if (show) {
			if (this.statusBarToggleFullscreenButtonEl.classList.contains("hidden")) {
				this.statusBarToggleFullscreenButtonEl.removeClass("hidden");
			}
		} else {
			if (!this.statusBarToggleFullscreenButtonEl.classList.contains("hidden")) {
				this.statusBarToggleFullscreenButtonEl.addClass("hidden");
			}
		}
	}

	// 清理资源
	unload = () => {
		this.statusBarToggleFullscreenButtonEl.removeEventListener("click", this.toggleFullscreen);
		window.removeEventListener("fullscreenchange", this.debouncedFullscreenChange);
		this.callbacks.clear();
	}
}
