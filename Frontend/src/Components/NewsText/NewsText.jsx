import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './NewsText.module.scss';
import SplitText from '../../SplitText/SplitText';
import LikeButton from '../../LikeButton/LikeButton';
import Switch from '../../Switch/Switch';
import Share from '../../Share/Share';

const NewsText = ({ p, ImgSrc, onShare }) => {
   const [showShareOptions, setShowShareOptions] = useState(false);
   const [like, setLike] = useState(1752);
   const [liked, setLiked] = useState(false);
   const [saved, setSaved] = useState(false);
   const [expanded, setExpanded] = useState(false);

   const words = p.split(' ');
   const isLongText = words.length > 200;
   const shortText = words.slice(0, 200).join(' ');

   const toggleExpanded = () => setExpanded(prev => !prev);
   const toggleLike = () => {
      setLike(prev => liked ? prev - 1 : prev + 1);
      setLiked(prev => !prev);
   };
   const toggleSave = () => setSaved(prev => !prev);

   const shareToSocialMedia = (platform) => {
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
            break;
      }

      window.open(shareUrl, '_blank');
   };

   const handleAnimationComplete = () => {
      console.log('Анимация завершена');
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
               {expanded ? (
                  <SplitText
                     text={p}
                     className="text-2xl font-semibold text-right"
                     delay={20}
                     animationFrom={{ opacity: 0, transform: 'translate3d(0, 20px, 0)' }}
                     animationTo={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
                     easing="easeOutCubic"
                     threshold={0.2}
                     rootMargin="-50px"
                     onLetterAnimationComplete={handleAnimationComplete}
                  />
               ) : (
                  <p className="text-right">{shortText + (isLongText ? '...' : '')}</p>
               )}
            </motion.div>

            {isLongText && (
               <button className={s.readMoreButton} onClick={toggleExpanded}>
                  {expanded ? 'Свернуть' : 'Читать дальше'}
               </button>
            )}

         <div className={s.likes}>
            
            <LikeButton count={like} onToggle={(state) => {
               setLiked(state);
               setLike(prev => state ? prev + 1 : prev - 1);
            }} />

            
            <Switch active={saved} onToggle={(state) => setSaved(state)} />

            <Share
               active={showShareOptions}
               onToggle={() => setShowShareOptions(prev => !prev)}
               onPlatformSelect={shareToSocialMedia}
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
