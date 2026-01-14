import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CATEGORY_CONFIG } from '../../constants/homeConstants';

interface CategoryGridProps {
  userId: string | undefined;
}

export function CategoryGrid({ userId }: CategoryGridProps): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 px-1">
        {t('home.categories')}
      </h2>
      <div className="grid grid-cols-2 gap-6">
        {CATEGORY_CONFIG.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/discover?category=${category.id}`)}
            className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-800 transition-all cursor-pointer group shadow-xl hover:shadow-2xl"
          >
            <div className="flex flex-col gap-5">
              <div
                className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/10`}
              >
                <category.icon className="w-7 h-7" />
              </div>

              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-black text-gray-950 dark:text-white mb-0.5 truncate tracking-tight">
                    {t(`categories.${category.id}`)}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    30+ {t('home.videosCount')}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-[#0085FF] group-hover:text-white transition-all shadow-inner">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
