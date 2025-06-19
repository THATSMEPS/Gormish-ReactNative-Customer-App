import { motion } from 'framer-motion';
import { categories } from '../data';
import clsx from 'clsx';

interface Props {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export const Categories = ({ selectedCategory, onCategorySelect }: Props) => {
  return (
    <div className="px-4 overflow-x-auto">
      <div className="flex gap-3 pb-2">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategorySelect(selectedCategory === category.id ? null : category.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all',
              selectedCategory === category.id ? 'bg-[#6552FF]' : 'bg-white'
            )}
          >
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center',
                selectedCategory === category.id ? 'border-[#6552FF]' : 'border-white'
              )}
            >
              <span className="text-xl">{category.icon}</span>
            </div>
            <span
              className={clsx(
                'whitespace-nowrap font-light',
                selectedCategory === category.id ? 'text-white' : 'text-black opacity-60'
              )}
            >
              {category.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};