import React from 'react';

const BrokenBottleIcon = ({ size = 20, color = 'currentColor', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12.0623 6.64336C12.3551 6.9947 12.5204 7.43956 12.5204 7.89679L12.5204 12V14M12.5204 14L15.5204 16M12.5204 14L9.52045 16M17.1517 7.04279L19.531 4.66348C19.9576 4.23693 20.0886 3.59301 19.8606 3.04265L19.6469 2.52682C19.3499 1.80996 18.5284 1.46506 17.8105 1.75836L17.2947 1.9691C16.8291 2.15933 16.5173 2.59368 16.5173 3.09633V5.51136C16.5173 6.04169 16.3066 6.5503 15.9315 6.92542L11.5833 11.2736C11.3323 11.5246 11.3323 11.9317 11.5833 12.1827L14.7374 15.3367C15.0219 15.6213 15.0219 16.0827 14.7374 16.3672L8.2736 22.831C7.94052 23.1641 7.42941 23.1641 7.09633 22.831L4.66723 20.4019C4.41727 20.152 4.41727 19.7468 4.66723 19.4969L7.56839 16.5957C7.63229 16.5318 7.63229 16.4282 7.56839 16.3643L6.09633 14.8922C5.76326 14.5592 5.76326 14.0192 6.09633 13.6861L9.04943 10.733C9.42456 10.3579 9.63529 9.84925 9.63529 9.31893V7.12643" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3L5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2L10 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8L3 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default BrokenBottleIcon;
