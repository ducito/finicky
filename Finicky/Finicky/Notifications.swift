import Foundation
import AppKit

func showNotification(title: String, subtitle: String? = nil, informativeText: String? = nil, error: Bool = false) -> Void {
    let notification = NSUserNotification()

    notification.title = title
    if subtitle != nil {
        notification.subtitle = subtitle!
    }

    if informativeText != nil {
        notification.informativeText = informativeText!
    }

    if error {
        notification.soundName = NSUserNotificationDefaultSoundName
    }
    
    NSUserNotificationCenter.default.deliver(notification)    
}
