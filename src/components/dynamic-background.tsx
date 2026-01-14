'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface DynamicBackgroundProps {
  className?: string;
}

export function DynamicBackground({ className = '' }: DynamicBackgroundProps) {
  const { theme } = useTheme();
  
  // Получаем реальное значение CSS переменной primary-foreground
  const [dotColor, setDotColor] = useState('#000000');
  
  useEffect(() => {
    // Get computed colors from elements that use these CSS variables
    const testElement = document.createElement('div');
    testElement.style.color = 'var(--primary-foreground)';
    document.body.appendChild(testElement);
    
    const computedStyle = getComputedStyle(testElement);
    const primaryForeground = computedStyle.color;
    
    document.body.removeChild(testElement);
    
    setDotColor(primaryForeground || '#000000');
  }, [theme]);
  
  return (
    <div className={`absolute inset-0 bg-primary ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
<svg width="929" height="1114" viewBox="0 0 929 1114" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.5" filter="url(#filter0_f_104_39)">
<path d="M163.575 62.6983C163.575 61.7603 162.814 61 161.876 61C160.938 61 160.178 61.7603 160.178 62.6983C160.178 116.535 116.535 160.178 62.6983 160.178C61.7603 160.178 61 160.938 61 161.876C61 162.814 61.7603 163.575 62.6983 163.575C116.535 163.575 160.178 207.218 160.178 261.054C160.178 261.992 160.938 262.753 161.876 262.753C162.814 262.753 163.575 261.992 163.575 261.054C163.575 207.218 207.218 163.575 261.054 163.575C261.992 163.575 262.753 162.814 262.753 161.876C262.753 160.938 261.992 160.178 261.054 160.178C207.218 160.178 163.575 116.535 163.575 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter1_f_104_39)">
<path d="M163.575 264.451C163.575 263.513 162.814 262.753 161.876 262.753C160.938 262.753 160.178 263.513 160.178 264.451C160.178 318.287 116.535 361.931 62.6983 361.931C61.7603 361.931 61 362.691 61 363.629C61 364.567 61.7603 365.327 62.6983 365.327C116.535 365.327 160.178 408.97 160.178 462.807C160.178 463.745 160.938 464.505 161.876 464.505C162.814 464.505 163.575 463.745 163.575 462.807C163.575 408.97 207.218 365.327 261.054 365.327C261.992 365.327 262.753 364.567 262.753 363.629C262.753 362.691 261.992 361.931 261.054 361.931C207.218 361.931 163.575 318.287 163.575 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter2_f_104_39)">
<path d="M163.575 466.203C163.575 465.265 162.814 464.505 161.876 464.505C160.938 464.505 160.178 465.265 160.178 466.203C160.178 520.04 116.535 563.683 62.6983 563.683C61.7603 563.683 61 564.444 61 565.381C61 566.319 61.7603 567.08 62.6983 567.08C116.535 567.08 160.178 610.723 160.178 664.56C160.178 665.497 160.938 666.258 161.876 666.258C162.814 666.258 163.575 665.497 163.575 664.56C163.575 610.723 207.218 567.08 261.054 567.08C261.992 567.08 262.753 566.319 262.753 565.381C262.753 564.444 261.992 563.683 261.054 563.683C207.218 563.683 163.575 520.04 163.575 466.203Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter3_f_104_39)">
<path d="M163.575 667.956C163.575 667.018 162.814 666.258 161.876 666.258C160.938 666.258 160.178 667.018 160.178 667.956C160.178 721.793 116.535 765.436 62.6983 765.436C61.7603 765.436 61 766.196 61 767.134C61 768.072 61.7603 768.833 62.6983 768.833C116.535 768.833 160.178 812.476 160.178 866.312C160.178 867.25 160.938 868.011 161.876 868.011C162.814 868.011 163.575 867.25 163.575 866.312C163.575 812.476 207.218 768.833 261.054 768.833C261.992 768.833 262.753 768.072 262.753 767.134C262.753 766.196 261.992 765.436 261.054 765.436C207.218 765.436 163.575 721.793 163.575 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter4_f_104_39)">
<path d="M365.327 62.6983C365.327 61.7603 364.567 61 363.629 61C362.691 61 361.931 61.7603 361.931 62.6983C361.931 116.535 318.287 160.178 264.451 160.178C263.513 160.178 262.752 160.938 262.752 161.876C262.752 162.814 263.513 163.575 264.451 163.575C318.287 163.575 361.931 207.218 361.931 261.054C361.931 261.992 362.691 262.753 363.629 262.753C364.567 262.753 365.327 261.992 365.327 261.054C365.327 207.218 408.97 163.575 462.807 163.575C463.745 163.575 464.505 162.814 464.505 161.876C464.505 160.938 463.745 160.178 462.807 160.178C408.97 160.178 365.327 116.535 365.327 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter5_f_104_39)">
<path d="M365.327 264.451C365.327 263.513 364.567 262.753 363.629 262.753C362.691 262.753 361.931 263.513 361.931 264.451C361.931 318.287 318.287 361.931 264.451 361.931C263.513 361.931 262.752 362.691 262.752 363.629C262.752 364.567 263.513 365.327 264.451 365.327C318.287 365.327 361.931 408.97 361.931 462.807C361.931 463.745 362.691 464.505 363.629 464.505C364.567 464.505 365.327 463.745 365.327 462.807C365.327 408.97 408.97 365.327 462.807 365.327C463.745 365.327 464.505 364.567 464.505 363.629C464.505 362.691 463.745 361.931 462.807 361.931C408.97 361.931 365.327 318.287 365.327 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter6_f_104_39)">
<path d="M365.327 466.203C365.327 465.265 364.567 464.505 363.629 464.505C362.691 464.505 361.931 465.265 361.931 466.203C361.931 520.04 318.287 563.683 264.451 563.683C263.513 563.683 262.752 564.444 262.752 565.381C262.752 566.319 263.513 567.08 264.451 567.08C318.287 567.08 361.931 610.723 361.931 664.56C361.931 665.497 362.691 666.258 363.629 666.258C364.567 666.258 365.327 665.497 365.327 664.56C365.327 610.723 408.97 567.08 462.807 567.08C463.745 567.08 464.505 566.319 464.505 565.381C464.505 564.444 463.745 563.683 462.807 563.683C408.97 563.683 365.327 520.04 365.327 466.203Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter7_f_104_39)">
<path d="M365.327 667.956C365.327 667.018 364.567 666.258 363.629 666.258C362.691 666.258 361.931 667.018 361.931 667.956C361.931 721.793 318.287 765.436 264.451 765.436C263.513 765.436 262.752 766.196 262.752 767.134C262.752 768.072 263.513 768.833 264.451 768.833C318.287 768.833 361.931 812.476 361.931 866.312C361.931 867.25 362.691 868.011 363.629 868.011C364.567 868.011 365.327 867.25 365.327 866.312C365.327 812.476 408.97 768.833 462.807 768.833C463.745 768.833 464.505 768.072 464.505 767.134C464.505 766.196 463.745 765.436 462.807 765.436C408.97 765.436 365.327 721.793 365.327 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter8_f_104_39)">
<path d="M567.08 62.6983C567.08 61.7603 566.32 61 565.382 61C564.444 61 563.683 61.7603 563.683 62.6983C563.683 116.535 520.04 160.178 466.204 160.178C465.266 160.178 464.505 160.938 464.505 161.876C464.505 162.814 465.266 163.575 466.204 163.575C520.04 163.575 563.683 207.218 563.683 261.054C563.683 261.992 564.444 262.753 565.382 262.753C566.32 262.753 567.08 261.992 567.08 261.054C567.08 207.218 610.723 163.575 664.56 163.575C665.498 163.575 666.258 162.814 666.258 161.876C666.258 160.938 665.498 160.178 664.56 160.178C610.723 160.178 567.08 116.535 567.08 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter9_f_104_39)">
<path d="M567.08 264.451C567.08 263.513 566.32 262.753 565.382 262.753C564.444 262.753 563.683 263.513 563.683 264.451C563.683 318.287 520.04 361.931 466.204 361.931C465.266 361.931 464.505 362.691 464.505 363.629C464.505 364.567 465.266 365.327 466.204 365.327C520.04 365.327 563.683 408.97 563.683 462.807C563.683 463.745 564.444 464.505 565.382 464.505C566.32 464.505 567.08 463.745 567.08 462.807C567.08 408.97 610.723 365.327 664.56 365.327C665.498 365.327 666.258 364.567 666.258 363.629C666.258 362.691 665.498 361.931 664.56 361.931C610.723 361.931 567.08 318.287 567.08 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter10_f_104_39)">
<path d="M567.08 466.203C567.08 465.265 566.32 464.505 565.382 464.505C564.444 464.505 563.683 465.265 563.683 466.203C563.683 520.04 520.04 563.683 466.204 563.683C465.266 563.683 464.505 564.444 464.505 565.381C464.505 566.319 465.266 567.08 466.204 567.08C520.04 567.08 563.683 610.723 563.683 664.56C563.683 665.497 564.444 666.258 565.382 666.258C566.32 666.258 567.08 665.497 567.08 664.56C567.08 610.723 610.723 567.08 664.56 567.08C665.498 567.08 666.258 566.319 666.258 565.381C666.258 564.444 665.498 563.683 664.56 563.683C610.723 563.683 567.08 520.04 567.08 466.203Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter11_f_104_39)">
<path d="M567.08 667.956C567.08 667.018 566.32 666.258 565.382 666.258C564.444 666.258 563.683 667.018 563.683 667.956C563.683 721.793 520.04 765.436 466.204 765.436C465.266 765.436 464.505 766.196 464.505 767.134C464.505 768.072 465.266 768.833 466.204 768.833C520.04 768.833 563.683 812.476 563.683 866.312C563.683 867.25 564.444 868.011 565.382 868.011C566.32 868.011 567.08 867.25 567.08 866.312C567.08 812.476 610.723 768.833 664.56 768.833C665.498 768.833 666.258 768.072 666.258 767.134C666.258 766.196 665.498 765.436 664.56 765.436C610.723 765.436 567.08 721.793 567.08 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter12_f_104_39)">
<path d="M163.575 62.6983C163.575 61.7603 162.814 61 161.876 61C160.938 61 160.178 61.7603 160.178 62.6983C160.178 116.535 116.535 160.178 62.6983 160.178C61.7603 160.178 61 160.938 61 161.876C61 162.814 61.7603 163.575 62.6983 163.575C116.535 163.575 160.178 207.218 160.178 261.054C160.178 261.992 160.938 262.753 161.876 262.753C162.814 262.753 163.575 261.992 163.575 261.054C163.575 207.218 207.218 163.575 261.054 163.575C261.992 163.575 262.753 162.814 262.753 161.876C262.753 160.938 261.992 160.178 261.054 160.178C207.218 160.178 163.575 116.535 163.575 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter13_f_104_39)">
<path d="M163.575 264.451C163.575 263.513 162.814 262.753 161.876 262.753C160.938 262.753 160.178 263.513 160.178 264.451C160.178 318.288 116.535 361.931 62.6983 361.931C61.7603 361.931 61 362.691 61 363.629C61 364.567 61.7603 365.327 62.6983 365.327C116.535 365.327 160.178 408.97 160.178 462.807C160.178 463.745 160.938 464.505 161.876 464.505C162.814 464.505 163.575 463.745 163.575 462.807C163.575 408.97 207.218 365.327 261.054 365.327C261.992 365.327 262.753 364.567 262.753 363.629C262.753 362.691 261.992 361.931 261.054 361.931C207.218 361.931 163.575 318.288 163.575 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter14_f_104_39)">
<path d="M163.575 466.204C163.575 465.266 162.814 464.505 161.876 464.505C160.938 464.505 160.178 465.266 160.178 466.204C160.178 520.04 116.535 563.683 62.6983 563.683C61.7603 563.683 61 564.444 61 565.382C61 566.32 61.7603 567.08 62.6983 567.08C116.535 567.08 160.178 610.723 160.178 664.56C160.178 665.498 160.938 666.258 161.876 666.258C162.814 666.258 163.575 665.498 163.575 664.56C163.575 610.723 207.218 567.08 261.054 567.08C261.992 567.08 262.753 566.32 262.753 565.382C262.753 564.444 261.992 563.683 261.054 563.683C207.218 563.683 163.575 520.04 163.575 466.204Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter15_f_104_39)">
<path d="M163.575 667.956C163.575 667.018 162.814 666.258 161.876 666.258C160.938 666.258 160.178 667.018 160.178 667.956C160.178 721.793 116.535 765.436 62.6983 765.436C61.7603 765.436 61 766.196 61 767.134C61 768.072 61.7603 768.833 62.6983 768.833C116.535 768.833 160.178 812.476 160.178 866.312C160.178 867.25 160.938 868.011 161.876 868.011C162.814 868.011 163.575 867.25 163.575 866.312C163.575 812.476 207.218 768.833 261.054 768.833C261.992 768.833 262.753 768.072 262.753 767.134C262.753 766.196 261.992 765.436 261.054 765.436C207.218 765.436 163.575 721.793 163.575 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter16_f_104_39)">
<path d="M365.328 62.6983C365.328 61.7603 364.567 61 363.629 61C362.691 61 361.931 61.7603 361.931 62.6983C361.931 116.535 318.288 160.178 264.451 160.178C263.513 160.178 262.753 160.938 262.753 161.876C262.753 162.814 263.513 163.575 264.451 163.575C318.288 163.575 361.931 207.218 361.931 261.054C361.931 261.992 362.691 262.753 363.629 262.753C364.567 262.753 365.328 261.992 365.328 261.054C365.328 207.218 408.971 163.575 462.807 163.575C463.745 163.575 464.506 162.814 464.506 161.876C464.506 160.938 463.745 160.178 462.807 160.178C408.971 160.178 365.328 116.535 365.328 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter17_f_104_39)">
<path d="M365.328 264.451C365.328 263.513 364.567 262.753 363.629 262.753C362.691 262.753 361.931 263.513 361.931 264.451C361.931 318.288 318.288 361.931 264.451 361.931C263.513 361.931 262.753 362.691 262.753 363.629C262.753 364.567 263.513 365.327 264.451 365.327C318.288 365.327 361.931 408.97 361.931 462.807C361.931 463.745 362.691 464.505 363.629 464.505C364.567 464.505 365.328 463.745 365.328 462.807C365.328 408.97 408.971 365.327 462.807 365.327C463.745 365.327 464.506 364.567 464.506 363.629C464.506 362.691 463.745 361.931 462.807 361.931C408.971 361.931 365.328 318.288 365.328 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter18_f_104_39)">
<path d="M365.328 466.204C365.328 465.266 364.567 464.505 363.629 464.505C362.691 464.505 361.931 465.266 361.931 466.204C361.931 520.04 318.288 563.683 264.451 563.683C263.513 563.683 262.753 564.444 262.753 565.382C262.753 566.32 263.513 567.08 264.451 567.08C318.288 567.08 361.931 610.723 361.931 664.56C361.931 665.498 362.691 666.258 363.629 666.258C364.567 666.258 365.328 665.498 365.328 664.56C365.328 610.723 408.971 567.08 462.807 567.08C463.745 567.08 464.506 566.32 464.506 565.382C464.506 564.444 463.745 563.683 462.807 563.683C408.971 563.683 365.328 520.04 365.328 466.204Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter19_f_104_39)">
<path d="M365.328 667.956C365.328 667.018 364.567 666.258 363.629 666.258C362.691 666.258 361.931 667.018 361.931 667.956C361.931 721.793 318.288 765.436 264.451 765.436C263.513 765.436 262.753 766.196 262.753 767.134C262.753 768.072 263.513 768.833 264.451 768.833C318.288 768.833 361.931 812.476 361.931 866.312C361.931 867.25 362.691 868.011 363.629 868.011C364.567 868.011 365.328 867.25 365.328 866.312C365.328 812.476 408.971 768.833 462.807 768.833C463.745 768.833 464.506 768.072 464.506 767.134C464.506 766.196 463.745 765.436 462.807 765.436C408.971 765.436 365.328 721.793 365.328 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter20_f_104_39)">
<path d="M567.08 62.6983C567.08 61.7603 566.32 61 565.382 61C564.444 61 563.683 61.7603 563.683 62.6983C563.683 116.535 520.04 160.178 466.204 160.178C465.266 160.178 464.505 160.938 464.505 161.876C464.505 162.814 465.266 163.575 466.204 163.575C520.04 163.575 563.683 207.218 563.683 261.054C563.683 261.992 564.444 262.753 565.382 262.753C566.32 262.753 567.08 261.992 567.08 261.054C567.08 207.218 610.723 163.575 664.56 163.575C665.498 163.575 666.258 162.814 666.258 161.876C666.258 160.938 665.498 160.178 664.56 160.178C610.723 160.178 567.08 116.535 567.08 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter21_f_104_39)">
<path d="M567.08 264.451C567.08 263.513 566.32 262.753 565.382 262.753C564.444 262.753 563.683 263.513 563.683 264.451C563.683 318.288 520.04 361.931 466.204 361.931C465.266 361.931 464.505 362.691 464.505 363.629C464.505 364.567 465.266 365.327 466.204 365.327C520.04 365.327 563.683 408.97 563.683 462.807C563.683 463.745 564.444 464.505 565.382 464.505C566.32 464.505 567.08 463.745 567.08 462.807C567.08 408.97 610.723 365.327 664.56 365.327C665.498 365.327 666.258 364.567 666.258 363.629C666.258 362.691 665.498 361.931 664.56 361.931C610.723 361.931 567.08 318.288 567.08 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter22_f_104_39)">
<path d="M567.08 466.204C567.08 465.266 566.32 464.505 565.382 464.505C564.444 464.505 563.683 465.266 563.683 466.204C563.683 520.04 520.04 563.683 466.204 563.683C465.266 563.683 464.505 564.444 464.505 565.382C464.505 566.32 465.266 567.08 466.204 567.08C520.04 567.08 563.683 610.723 563.683 664.56C563.683 665.498 564.444 666.258 565.382 666.258C566.32 666.258 567.08 665.498 567.08 664.56C567.08 610.723 610.723 567.08 664.56 567.08C665.498 567.08 666.258 566.32 666.258 565.382C666.258 564.444 665.498 563.683 664.56 563.683C610.723 563.683 567.08 520.04 567.08 466.204Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter23_f_104_39)">
<path d="M567.08 667.956C567.08 667.018 566.32 666.258 565.382 666.258C564.444 666.258 563.683 667.018 563.683 667.956C563.683 721.793 520.04 765.436 466.204 765.436C465.266 765.436 464.505 766.196 464.505 767.134C464.505 768.072 465.266 768.833 466.204 768.833C520.04 768.833 563.683 812.476 563.683 866.312C563.683 867.25 564.444 868.011 565.382 868.011C566.32 868.011 567.08 867.25 567.08 866.312C567.08 812.476 610.723 768.833 664.56 768.833C665.498 768.833 666.258 768.072 666.258 767.134C666.258 766.196 665.498 765.436 664.56 765.436C610.723 765.436 567.08 721.793 567.08 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter24_f_104_39)">
<path d="M768.706 62.6983C768.706 61.7603 767.946 61 767.008 61C766.07 61 765.309 61.7603 765.309 62.6983C765.309 116.535 721.666 160.178 667.83 160.178C666.892 160.178 666.131 160.938 666.131 161.876C666.131 162.814 666.892 163.575 667.83 163.575C721.666 163.575 765.309 207.218 765.309 261.054C765.309 261.992 766.07 262.753 767.008 262.753C767.946 262.753 768.706 261.992 768.706 261.054C768.706 207.218 812.349 163.575 866.186 163.575C867.124 163.575 867.884 162.814 867.884 161.876C867.884 160.938 867.124 160.178 866.186 160.178C812.349 160.178 768.706 116.535 768.706 62.6983Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter25_f_104_39)">
<path d="M768.706 264.451C768.706 263.513 767.946 262.753 767.008 262.753C766.07 262.753 765.309 263.513 765.309 264.451C765.309 318.287 721.666 361.931 667.83 361.931C666.892 361.931 666.131 362.691 666.131 363.629C666.131 364.567 666.892 365.327 667.83 365.327C721.666 365.327 765.309 408.97 765.309 462.807C765.309 463.745 766.07 464.505 767.008 464.505C767.946 464.505 768.706 463.745 768.706 462.807C768.706 408.97 812.349 365.327 866.186 365.327C867.124 365.327 867.884 364.567 867.884 363.629C867.884 362.691 867.124 361.931 866.186 361.931C812.349 361.931 768.706 318.287 768.706 264.451Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter26_f_104_39)">
<path d="M768.706 466.203C768.706 465.265 767.946 464.505 767.008 464.505C766.07 464.505 765.309 465.265 765.309 466.203C765.309 520.04 721.666 563.683 667.83 563.683C666.892 563.683 666.131 564.444 666.131 565.381C666.131 566.319 666.892 567.08 667.83 567.08C721.666 567.08 765.309 610.723 765.309 664.56C765.309 665.497 766.07 666.258 767.008 666.258C767.946 666.258 768.706 665.497 768.706 664.56C768.706 610.723 812.349 567.08 866.186 567.08C867.124 567.08 867.884 566.319 867.884 565.381C867.884 564.444 867.124 563.683 866.186 563.683C812.349 563.683 768.706 520.04 768.706 466.203Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter27_f_104_39)">
<path d="M768.706 667.956C768.706 667.018 767.946 666.258 767.008 666.258C766.07 666.258 765.309 667.018 765.309 667.956C765.309 721.793 721.666 765.436 667.83 765.436C666.892 765.436 666.131 766.196 666.131 767.134C666.131 768.072 666.892 768.833 667.83 768.833C721.666 768.833 765.309 812.476 765.309 866.312C765.309 867.25 766.07 868.011 767.008 868.011C767.946 868.011 768.706 867.25 768.706 866.312C768.706 812.476 812.349 768.833 866.186 768.833C867.124 768.833 867.884 768.072 867.884 767.134C867.884 766.196 867.124 765.436 866.186 765.436C812.349 765.436 768.706 721.793 768.706 667.956Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter28_f_104_39)">
<path d="M163.575 849.946C163.575 849.008 162.814 848.247 161.876 848.247C160.938 848.247 160.178 849.008 160.178 849.946C160.178 903.782 116.535 947.425 62.6983 947.425C61.7603 947.425 61 948.186 61 949.124C61 950.062 61.7603 950.822 62.6983 950.822C116.535 950.822 160.178 994.465 160.178 1048.3C160.178 1049.24 160.938 1050 161.876 1050C162.814 1050 163.575 1049.24 163.575 1048.3C163.575 994.465 207.218 950.822 261.054 950.822C261.992 950.822 262.753 950.062 262.753 949.124C262.753 948.186 261.992 947.425 261.054 947.425C207.218 947.425 163.575 903.782 163.575 849.946Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter29_f_104_39)">
<path d="M365.328 849.946C365.328 849.008 364.567 848.247 363.629 848.247C362.691 848.247 361.931 849.008 361.931 849.946C361.931 903.782 318.288 947.425 264.451 947.425C263.513 947.425 262.753 948.186 262.753 949.124C262.753 950.062 263.513 950.822 264.451 950.822C318.288 950.822 361.931 994.465 361.931 1048.3C361.931 1049.24 362.691 1050 363.629 1050C364.567 1050 365.328 1049.24 365.328 1048.3C365.328 994.465 408.971 950.822 462.807 950.822C463.745 950.822 464.506 950.062 464.506 949.124C464.506 948.186 463.745 947.425 462.807 947.425C408.971 947.425 365.328 903.782 365.328 849.946Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter30_f_104_39)">
<path d="M567.08 849.946C567.08 849.008 566.32 848.247 565.382 848.247C564.444 848.247 563.683 849.008 563.683 849.946C563.683 903.782 520.04 947.425 466.204 947.425C465.266 947.425 464.505 948.186 464.505 949.124C464.505 950.062 465.266 950.822 466.204 950.822C520.04 950.822 563.683 994.465 563.683 1048.3C563.683 1049.24 564.444 1050 565.382 1050C566.32 1050 567.08 1049.24 567.08 1048.3C567.08 994.465 610.723 950.822 664.56 950.822C665.498 950.822 666.258 950.062 666.258 949.124C666.258 948.186 665.498 947.425 664.56 947.425C610.723 947.425 567.08 903.782 567.08 849.946Z" fill="${dotColor}"/>
</g>
<g opacity="0.5" filter="url(#filter31_f_104_39)">
<path d="M768.706 849.946C768.706 849.008 767.946 848.247 767.008 848.247C766.07 848.247 765.309 849.008 765.309 849.946C765.309 903.782 721.666 947.425 667.83 947.425C666.892 947.425 666.131 948.186 666.131 949.124C666.131 950.062 666.892 950.822 667.83 950.822C721.666 950.822 765.309 994.465 765.309 1048.3C765.309 1049.24 766.07 1050 767.008 1050C767.946 1050 768.706 1049.24 768.706 1048.3C768.706 994.465 812.349 950.822 866.186 950.822C867.124 950.822 867.884 950.062 867.884 949.124C867.884 948.186 867.124 947.425 866.186 947.425C812.349 947.425 768.706 903.782 768.706 849.946Z" fill="${dotColor}"/>
</g>
<defs>
<filter id="filter0_f_104_39" x="53" y="53" width="217.752" height="217.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="4" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter1_f_104_39" x="45" y="246.753" width="233.752" height="233.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="8" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter2_f_104_39" x="24.534" y="428.039" width="274.684" height="274.685" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="18.233" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter3_f_104_39" x="0.223408" y="605.481" width="323.306" height="323.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.3883" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter4_f_104_39" x="246.752" y="45" width="233.752" height="233.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="8" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter5_f_104_39" x="238.442" y="238.442" width="250.374" height="250.374" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="12.1553" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter6_f_104_39" x="226.286" y="428.039" width="274.684" height="274.685" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="18.233" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter7_f_104_39" x="214.131" y="617.637" width="298.995" height="298.995" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="24.3106" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter8_f_104_39" x="449.505" y="46" width="231.752" height="231.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="7.5" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter9_f_104_39" x="436.505" y="234.753" width="257.752" height="257.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="14" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter10_f_104_39" x="432.505" y="432.505" width="265.752" height="265.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter11_f_104_39" x="400.505" y="602.258" width="329.752" height="329.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter12_f_104_39" x="0.220001" y="0.220001" width="323.312" height="323.313" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.39" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter13_f_104_39" x="0.220001" y="201.973" width="323.312" height="323.313" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.39" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter14_f_104_39" x="24.534" y="428.039" width="274.684" height="274.685" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="18.233" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter15_f_104_39" x="0.223408" y="605.481" width="323.306" height="323.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.3883" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter16_f_104_39" x="226.283" y="24.53" width="274.692" height="274.693" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="18.235" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter17_f_104_39" x="238.442" y="238.442" width="250.374" height="250.374" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="12.1553" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter18_f_104_39" x="226.287" y="428.039" width="274.684" height="274.685" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="18.233" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter19_f_104_39" x="214.132" y="617.637" width="298.995" height="298.995" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="24.3106" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter20_f_104_39" x="449.505" y="46" width="231.752" height="231.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="7.5" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter21_f_104_39" x="436.505" y="234.753" width="257.752" height="257.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="14" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter22_f_104_39" x="432.505" y="432.505" width="265.752" height="265.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter23_f_104_39" x="400.505" y="602.258" width="329.752" height="329.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter24_f_104_39" x="658.131" y="53" width="217.753" height="217.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="4" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter25_f_104_39" x="650.131" y="246.753" width="233.753" height="233.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="8" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter26_f_104_39" x="629.665" y="428.039" width="274.685" height="274.685" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="18.233" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter27_f_104_39" x="605.355" y="605.481" width="323.306" height="323.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.3883" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter28_f_104_39" x="0.223408" y="787.471" width="323.306" height="323.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.3883" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter29_f_104_39" x="214.132" y="799.626" width="298.995" height="298.995" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="24.3106" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter30_f_104_39" x="400.505" y="784.247" width="329.752" height="329.753" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur_104_39"/>
</filter>
<filter id="filter31_f_104_39" x="605.355" y="787.471" width="323.306" height="323.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="30.3883" result="effect1_foregroundBlur_104_39"/>
</filter>
</defs>
</svg>

          `)}")`,
          backgroundSize: '100% auto'
        }}
      />
    </div>
  );
} 