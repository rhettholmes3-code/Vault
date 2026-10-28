import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

export interface ReleaseInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
}

/**
 * 比较两个语义化版本号 (例如 "1.1.1" 与 "1.1.0")
 * 返回: 1 表示 v1 > v2; -1 表示 v1 < v2; 0 表示相等
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

const GITHUB_OWNER = 'rhettholmes3-code';
const GITHUB_REPO = 'Vault';

export const UpdateService = {
  /**
   * 获取当前 App 版本号
   */
  getCurrentVersion: (): string => {
    return Constants.expoConfig?.version || '1.1.0';
  },

  /**
   * 检查 GitHub Releases 是否有新版本
   */
  checkUpdate: async (): Promise<ReleaseInfo> => {
    const currentVersion = UpdateService.getCurrentVersion();
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Vault-App',
      },
    });

    if (response.status === 404) {
      // 仓库尚未发布任何 Release
      return {
        hasUpdate: false,
        latestVersion: currentVersion,
        currentVersion,
        releaseNotes: '',
        publishedAt: '',
        downloadUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      };
    }

    if (!response.ok) {
      throw new Error(`GitHub API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const rawTag = data.tag_name || '';
    const latestVersion = rawTag.replace(/^v/i, '').trim();
    const hasUpdate = compareSemver(latestVersion, currentVersion) > 0;

    // 优先寻找 assets 中扩展名为 .apk 的下载直链
    let downloadUrl = data.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find((asset: any) => 
        typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset && apkAsset.browser_download_url) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    return {
      hasUpdate,
      latestVersion,
      currentVersion,
      releaseNotes: data.body || '',
      publishedAt: data.published_at ? data.published_at.split('T')[0] : '',
      downloadUrl,
    };
  },

  /**
   * 打开系统浏览器直接下载 APK 附件
   */
  openDownloadUrl: async (url: string): Promise<void> => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      throw new Error('Cannot open URL');
    }
  },
};
