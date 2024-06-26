'use client';

import Link from 'next/link';
import {
  HomeIcon,
  Squares2X2Icon,
  CalendarIcon,
  ChartBarIcon,
  Bars3Icon,
} from '@heroicons/react/24/solid';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface NavBarProps {
  mode: 'CHILD' | 'PARENT';
}

interface itemProp {
  id: number;
  icon: React.ReactElement;
  path: string;
  label: string;
}

const setIndex = (path: string | null) => {
  switch (path) {
    case '/':
      return 0;
    case '/pay':
      return 1;
    case '/book':
      return 2;
    case '/stock':
    case '/stock/list':
    case '/stock/rank':
    case '/stock/storage':
      return 3;
    case '/user':
    case '/loan/list':
    case '/loan/apply/success':
    case '/savings/mine':
    case '/loan/success':
      return 4;
    default:
      return 0;
  }
};

export default function NavBar({ mode }: NavBarProps) {
  const path = usePathname();

  let items: itemProp[];

  const [selectIndex, setSelectedIndex] = useState(setIndex(path));

  switch (mode) {
    case 'CHILD':
      items = [
        {
          id: 0,
          icon: <HomeIcon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/',
          label: '홈',
        },
        {
          id: 1,
          icon: <Squares2X2Icon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/transfer',
          label: '송금',
        },
        {
          id: 2,
          icon: <CalendarIcon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/book',
          label: '가계부',
        },
        {
          id: 3,
          icon: <ChartBarIcon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/stock',
          label: '날씨주식',
        },
        {
          id: 4,
          icon: <Bars3Icon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/user',
          label: '전체',
        },
      ];
      break;
    case 'PARENT':
      items = [
        {
          id: 0,
          icon: <HomeIcon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/',
          label: '홈',
        },
        {
          id: 1,
          icon: <Squares2X2Icon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/transfer',
          label: '송금',
        },
        {
          id: 2,
          icon: <CalendarIcon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/book',
          label: '가계부',
        },
        {
          id: 4,
          icon: <Bars3Icon className="h-[2.4rem] w-[2.4rem] 4" />,
          path: '/user',
          label: '전체',
        },
      ];
      break;
  }

  return (
    <div
      className={`w-full sticky bottom-0 h-[7.5rem] rounded-t-[1.6rem] border border-b-0 border-x-0 border-custom-light-gray bg-custom-white flex justify-center pt-[1.5rem]`}
    >
      {items.map(({ icon, path, label, id }, index) => (
        <Link
          className={` w-full h-[3.7rem] text-custom-black custom-semibold-text bg-custom-white flex items-center justify-center`}
          href={path}
          key={index}
          onClick={() => setSelectedIndex(index)}
        >
          <div
            className={`flex flex-col items-center ${
              selectIndex === id
                ? 'text-custom-purple'
                : 'text-custom-medium-gray'
            }`}
          >
            {icon}
            <span className="mt-[0.1rem] text-[10px]">{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
