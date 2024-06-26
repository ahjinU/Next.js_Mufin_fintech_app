'use client';

import { useState } from 'react';

export interface TagType {
  label: string;
  onClick: () => void;
}

interface TagProps {
  tags: TagType[];
  index?: number;
}

export default function Tag({ tags, index }: TagProps) {
  const [selectIndex, setSelectIndex] = useState<number>(index || 0);

  const handleClick = (ind: number) => {
    setSelectIndex(ind);
    tags[ind].onClick();
  };

  return (
    <div className="w-full flex gap-[0.4rem] items-center">
      {tags.map(({ label }, index) => (
        <button
          key={`tag-${index}`}
          className={`w-[5.0rem] h-[3.0rem] rounded-[0.8rem] custom-medium-text 
          ${
            index === selectIndex
              ? 'bg-custom-light-purple text-custom-white'
              : 'bg-custom-white text-custom-dark-gray  border-[0.1rem] border-custom-light-gray'
          }
          `}
          onClick={() => handleClick(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
