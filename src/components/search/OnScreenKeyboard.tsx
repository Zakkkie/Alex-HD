import React, { useState } from 'react';
import { Delete, Space, X, Search } from 'lucide-react';
import { useTVNavigation } from '../../navigation/useTVNavigation';

interface OnScreenKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

const RU_KEYS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
];

const EN_KEYS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const KeyButton: React.FC<{
  id: string;
  label: string | React.ReactNode;
  onPress: () => void;
  className?: string;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}> = ({ id, label, onPress, className = 'w-9 h-11 sm:w-11 sm:h-12 md:w-12 md:h-13', up, down, left, right }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    up,
    down,
    left,
    right,
    onEnter: onPress
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onPress}
      className={`${className} font-mono-code font-bold text-sm sm:text-base md:text-lg rounded-xl transition-[transform,background-color,border-color,box-shadow] duration-150 outline-none flex items-center justify-center select-none cursor-pointer border ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-110 shadow-[0_0_20px_rgba(212,181,129,0.7)] border-[#d4b581] z-20 font-extrabold ring-2 ring-[#d4b581]'
          : 'bg-[#e6e3df]/5 text-[#e6e3df]/90 border-[#e6e3df]/15 hover:bg-[#e6e3df]/15 hover:border-[#e6e3df]/30'
      }`}
    >
      {label}
    </button>
  );
};

export const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  value,
  onChange,
  onClear
}) => {
  const [layout, setLayout] = useState<'RU' | 'EN'>('RU');
  const currentKeys = layout === 'RU' ? RU_KEYS : EN_KEYS;

  const handleKeyPress = (char: string) => {
    onChange(value + char);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    onChange(value + ' ');
  };

  const lastRow = currentKeys[currentKeys.length - 1];

  return (
    <div className="bg-[#0f0e0d] border border-[#d4b581]/30 p-5 sm:p-6 rounded-2xl shadow-2xl w-full max-w-3xl">
      {/* Header & Switch Layout */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e6e3df]/10">
        <span className="font-mono-code text-xs uppercase tracking-widest text-[#d4b581] font-bold">
          Экранная Клавиатура ({layout === 'RU' ? 'ЙЦУКЕН QWERTY' : 'EN QWERTY'})
        </span>
        <span className="font-mono-code text-[11px] text-[#e6e3df]/50">
          Используйте стрелки пульта или мышь
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#000000]/60 border border-[#e6e3df]/20 rounded-xl mb-5">
        <Search className="w-5 h-5 text-[#d4b581] shrink-0" />
        <input
          type="text"
          readOnly
          value={value}
          placeholder="Введите название фильма..."
          className="w-full bg-transparent font-serif-body text-lg sm:text-xl text-[#e6e3df] placeholder-[#e6e3df]/30 outline-none"
        />
        {value.length > 0 && (
          <button
            onClick={onClear}
            className="p-1.5 bg-[#e6e3df]/10 text-[#e6e3df]/60 hover:text-[#e6e3df] rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Keyboard Grid */}
      <div className="space-y-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {currentKeys.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center gap-1.5 sm:gap-2 justify-center">
            {row.map((char, cIdx) => {
              const keyId = `kb-key-${rIdx}-${cIdx}`;
              const left = cIdx === 0 ? 'sidebar-search' : `kb-key-${rIdx}-${cIdx - 1}`;
              const right = cIdx < row.length - 1 ? `kb-key-${rIdx}-${cIdx + 1}` : undefined;
              const up = rIdx > 0 ? `kb-key-${rIdx - 1}-${Math.min(cIdx, currentKeys[rIdx - 1].length - 1)}` : undefined;
              const down = rIdx < currentKeys.length - 1 ? `kb-key-${rIdx + 1}-${Math.min(cIdx, currentKeys[rIdx + 1].length - 1)}` : 'kb-space';

              return (
                <KeyButton
                  key={keyId}
                  id={keyId}
                  label={char}
                  onPress={() => handleKeyPress(char)}
                  up={up}
                  down={down}
                  left={left}
                  right={right}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Control row: Space, Backspace, Language Switch */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#e6e3df]/10">
        <KeyButton
          id="kb-lang"
          label={layout === 'RU' ? 'RU / EN' : 'EN / RU'}
          className="w-24 h-12 sm:h-13"
          onPress={() => setLayout(l => (l === 'RU' ? 'EN' : 'RU'))}
          up={`kb-key-${currentKeys.length - 1}-0`}
          right="kb-space"
          left="sidebar-search"
        />

        <div className="flex-1">
          <KeyButton
            id="kb-space"
            label={<span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Пробел (Space)</span>}
            className="w-full h-12 sm:h-13"
            onPress={handleSpace}
            up={`kb-key-${currentKeys.length - 1}-${Math.floor(lastRow.length / 2)}`}
            left="kb-lang"
            right="kb-backspace"
          />
        </div>

        <KeyButton
          id="kb-backspace"
          label={<Delete className="w-5 h-5 sm:w-6 sm:h-6" />}
          className="w-20 h-12 sm:h-13"
          onPress={handleBackspace}
          up={`kb-key-${currentKeys.length - 1}-${lastRow.length - 1}`}
          left="kb-space"
        />
      </div>
    </div>
  );
};
