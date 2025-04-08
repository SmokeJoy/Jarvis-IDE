import React from 'react'
import { Avatar } from './JarvisIdeAccountInfoCard.styles'

interface UserAvatarProps {
    photoURL?: string | null
    displayName?: string | null
    email?: string | null
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ photoURL, displayName, email }) => {
    if (photoURL) {
        return (
            <Avatar hasImage>
                <img 
                    src={photoURL} 
                    alt={displayName || 'Foto profilo'} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
            </Avatar>
        )
    }

    return (
        <Avatar>
            {displayName?.[0] || email?.[0] || '?'}
        </Avatar>
    )
} 