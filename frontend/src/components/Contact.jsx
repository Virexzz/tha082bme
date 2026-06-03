import React from 'react';
import './Contact.css';
import { HugeiconsIcon } from '@hugeicons/react';
import {InstagramIcon} from '@hugeicons/core-free-icons'
import {Facebook02Icon} from '@hugeicons/core-free-icons'
import {DiscordIcon} from '@hugeicons/core-free-icons'
import {Mail01Icon} from '@hugeicons/core-free-icons'

function Contact() {
    const socialLinks = [
        {
            platform: 'Instagram',
            icon: <HugeiconsIcon icon={InstagramIcon} />,
            handle: '@memech_al',
            pun: 'Keeping our life in motion. No friction, just pure vibes.',
            btnText: 'Follow Us',
            url: 'https://www.instagram.com/memech_al'
        },
        {
            platform: 'Facebook',
            icon: <HugeiconsIcon icon={Facebook02Icon} />,
            handle: 'IOE Thapathali Mechanical 2082',
            pun: 'Where our social network has higher torque than our engines.',
            btnText: 'Connect',
            url: 'https://facebook.com'
        },
        {
            platform: 'Discord',
            icon: <HugeiconsIcon icon={DiscordIcon} />,
            handle: 'Thapathali Mechanical 082',
            pun: 'A server with zero thermal stress. Join for the chaos & calculations.',
            btnText: 'Join Server',
            url: 'https://discord.gg/UgsnNy47Tj'
        },
        {
            platform: 'Email',
            icon: <HugeiconsIcon icon={Mail01Icon} />,
            handle: 'tha082bme@gmail.com',
            pun: 'Ping us! Unlike our CAD renders, we respond instantly.',
            btnText: 'Drop a Mail',
            url: 'mailto:tha082bme@gmail.com'
        }
    ];

    return (
        <div className="contact-page">
            <div className="contact-header">
                <h1 className="contact-title">Connect With Us</h1>
                <p className="contact-subtitle">Let's build something great together. Pick your platform.</p>
            </div>
            
            <div className="social-grid">
                {socialLinks.map((social, index) => (
                    <div className="social-card" key={index}>
                        {/* Front Face of the Card */}
                        <div className="card-front">
                            <span className="platform-icon">{social.icon}</span>
                            <h3>{social.platform}</h3>
                            <span className="hover-hint">Hover to unlock</span>
                        </div>
                        
                        {/* Back Face of the Card (Popup details) */}
                        <div className="card-back">
                            <h4>{social.handle}</h4>
                            <p className="card-pun">"{social.pun}"</p>
                            <a href={social.url} target="_blank" rel="noopener noreferrer" className="action-button">
                                {social.btnText}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Contact;