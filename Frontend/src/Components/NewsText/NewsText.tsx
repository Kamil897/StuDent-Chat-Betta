import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './NewsText.module.css';

/* ===== TYPES ===== */
type SharePlatform = 'facebook' | 'twitter' | 'whatsapp';

interface NewsTextProps {
  p: string;
  ImgSrc: string;
  onShare?: (platform: SharePlatform) => void;
}

/* ===== COMPONENT ===== */
const NewsText: React.FC<NewsTextProps> = ({ p, ImgSrc, onShare }) => {
  const [showShareOptions, setShowShareOptions] = useState<boolean>(false);
  const [like, setLike] = useState<number>(1752);
  const [liked, setLiked] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  const words = p.split(' ');
  const isLongText = words.length > 200;
  const shortText = words.slice(0, 200).join(' ');

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const shareToSocialMedia = (platform: SharePlatform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(p);
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
    onShare?.(platform);
  };

  /* ===== INLINE COMPONENTS ===== */
  const LikeButton: React.FC<{ count: number; onToggle: (state: boolean) => void }> = ({
    count,
    onToggle,
  }) => (
    <button
      className={s.likeButton}
      onClick={() => onToggle(!liked)}
      style={{ marginRight: '10px' }}
    >
      {liked ? '❤️' : '🤍'} {count}
    </button>
  );

  const Switch: React.FC<{ active: boolean; onToggle: (state: boolean) => void }> = ({
    active,
    onToggle,
  }) => (
    <button
      className={s.switchButton}
      onClick={() => onToggle(!active)}
      style={{ marginRight: '10px' }}
    >
      {active ? '💾 Saved' : '💾 Save'}
    </button>
  );

  const Share: React.FC<{ onToggle: () => void }> = ({ onToggle }) => (
    <button className={s.shareButton} onClick={onToggle}>
      🔗 Share
    </button>
  );
  

  const SplitText: React.FC<{ text: string }> = ({ text }) => {
    return (
      <p style={{ lineHeight: 1.5, textAlign: 'right' }}>
        {text.split(' ').map((word, i) => (
          <span key={i} style={{ display: 'inline-block', marginRight: '4px' }}>
            {word}
          </span>
        ))}
      </p>
    );
  };

  return (
    <div className={s.news}>
      <motion.div
        className={s.newslogo}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <img src={ImgSrc} alt="News" />
      </motion.div>

      <div className={s.content}>
        <motion.div
          className={`${s.textWrapper} ${expanded ? s.expanded : ''}`}
          initial={false}
          animate={{ maxHeight: expanded ? 2000 : 250 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {expanded ? <SplitText text={p} /> : <p style={{ textAlign: 'right' }}>{shortText}{isLongText && '...'}</p>}
        </motion.div>

        {isLongText && (
          <button className={s.readMoreButton} onClick={toggleExpanded}>
            {expanded ? 'Свернуть' : 'Читать дальше'}
          </button>
        )}

        <div className={s.likes}>
          <LikeButton
            count={like}
            onToggle={(state: boolean) => {
              setLiked(state);
              setLike((prev) => (state ? prev + 1 : prev - 1));
            }}
          />
          <Switch active={saved} onToggle={(state: boolean) => setSaved(state)} />
          <Share
            onToggle={() => setShowShareOptions((prev) => !prev)}
          />
        </div>

        <AnimatePresence>
          {showShareOptions && (
            <motion.div
              className={s.shareOptions}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <button onClick={() => shareToSocialMedia('facebook')}>Facebook</button>
              <button onClick={() => shareToSocialMedia('twitter')}>Twitter</button>
              <button onClick={() => shareToSocialMedia('whatsapp')}>WhatsApp</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NewsText;
