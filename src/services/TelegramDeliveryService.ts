/**
 * TelegramDeliveryService - Handles video delivery via Telegram
 *
 * MANUAL WORKFLOW (Phase 1):
 * 1. Open Telegram chat with customer's phone number
 * 2. Copy processed video path to clipboard
 * 3. User manually attaches and sends
 *
 * FUTURE (Phase 2+): Telegram Bot API for automated delivery
 */

import {Linking, Share, Alert} from 'react-native';

class TelegramDeliveryService {
  /**
   * Open Telegram chat with customer
   * Uses deep linking to open Telegram app
   */
  async openTelegramChat(phoneNumber: string): Promise<boolean> {
    try {
      // Format phone number - remove spaces and special chars
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

      // Telegram deep link format
      // For phone numbers: tg://resolve?phone=+251912345678
      const telegramUrl = `tg://resolve?phone=${encodeURIComponent(cleanPhone)}`;

      console.log('[TelegramDelivery] Opening Telegram chat:', telegramUrl);

      // Check if Telegram is installed
      const canOpen = await Linking.canOpenURL(telegramUrl);

      if (!canOpen) {
        console.error('[TelegramDelivery] Telegram app not installed');
        throw new Error('Telegram app is not installed on this device');
      }

      // Open Telegram
      await Linking.openURL(telegramUrl);
      console.log('[TelegramDelivery] ✅ Telegram chat opened');
      return true;
    } catch (error) {
      console.error('[TelegramDelivery] Error opening Telegram:', error);
      throw new Error(
        `Failed to open Telegram: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Show video file path to user
   * User can manually find the file in their file manager
   */
  async showVideoPath(videoPath: string): Promise<void> {
    console.log('[TelegramDelivery] Video path:', videoPath);
    // Show alert with the path - user can screenshot or remember it
    Alert.alert(
      'Video Location',
      `Your video is saved at:\n\n${videoPath}\n\nYou can find it in your Files app under "PhotoBooth360" folder.`,
      [{text: 'OK'}]
    );
  }

  /**
   * Copy video file path to clipboard (legacy method name for compatibility)
   */
  async copyVideoPathToClipboard(videoPath: string): Promise<void> {
    await this.showVideoPath(videoPath);
  }

  /**
   * Share video using native share sheet
   * User can select Telegram from the share menu
   * Note: Uses React Native's built-in Share API (can share text/URL, not files directly)
   * For file sharing, we open Telegram and copy the path
   */
  async shareVideoToTelegram(
    videoPath: string,
    customerName: string,
  ): Promise<boolean> {
    try {
      console.log('[TelegramDelivery] Opening share sheet for:', videoPath);

      // React Native's built-in Share can share messages but not files directly
      // We'll share a message and the user can attach the file manually
      const result = await Share.share({
        message: `PhotoBooth360 video for ${customerName}\n\nVideo saved at: ${videoPath}`,
        title: `Share video for ${customerName}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('[TelegramDelivery] ✅ Share completed');
        return true;
      } else if (result.action === Share.dismissedAction) {
        console.log('[TelegramDelivery] User dismissed share');
        return false;
      }

      return false;
    } catch (error: any) {
      console.error('[TelegramDelivery] Error sharing video:', error);
      throw new Error(
        `Failed to share video: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Complete manual delivery workflow
   * 1. Opens Telegram chat
   * 2. Shows share sheet or copies path
   */
  async deliverVideo(
    videoPath: string,
    phoneNumber: string,
    customerName: string,
  ): Promise<void> {
    console.log('[TelegramDelivery] Starting manual delivery workflow');

    try {
      // Option 1: Try native share (best UX)
      try {
        const shared = await this.shareVideoToTelegram(videoPath, customerName);
        if (shared) {
          console.log('[TelegramDelivery] ✅ Delivery workflow completed via share');
          return;
        }
      } catch (shareError) {
        console.warn('[TelegramDelivery] Share failed, falling back to manual:', shareError);
      }

      // Option 2: Open Telegram + copy path (fallback)
      await this.openTelegramChat(phoneNumber);
      await this.copyVideoPathToClipboard(videoPath);

      console.log('[TelegramDelivery] ✅ Telegram opened and path copied');
      console.log('[TelegramDelivery] User should manually attach and send video');
    } catch (error) {
      console.error('[TelegramDelivery] Delivery workflow failed:', error);
      throw error;
    }
  }

  /**
   * Check if Telegram is installed
   */
  async isTelegramInstalled(): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL('tg://');
      return canOpen;
    } catch {
      return false;
    }
  }

  /**
   * Get formatted message for manual copying
   */
  getDeliveryMessage(customerName: string, eventName: string): string {
    return `Hi ${customerName}! 🎉\n\nHere's your PhotoBooth360 video from ${eventName}!\n\nEnjoy and thanks for celebrating with us! 📸`;
  }

  /**
   * Show delivery message to user
   */
  async showDeliveryMessage(customerName: string, eventName: string): Promise<void> {
    const message = this.getDeliveryMessage(customerName, eventName);
    Alert.alert('Delivery Message', message, [{text: 'OK'}]);
    console.log('[TelegramDelivery] ✅ Delivery message shown');
  }

  /**
   * Copy delivery message to clipboard (legacy method name)
   */
  async copyDeliveryMessage(customerName: string, eventName: string): Promise<void> {
    await this.showDeliveryMessage(customerName, eventName);
  }
}

// Export singleton instance
export default new TelegramDeliveryService();
