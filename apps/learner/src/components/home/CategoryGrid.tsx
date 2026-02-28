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
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
          {t('home.categories')}
        </h2>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
          滑动查看更多 →
        </span>
      </div>

      {/* Horizontal Scroll Categories */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {CATEGORY_CONFIG.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/discover?category=${category.id}`)}
            className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800 transition-all cursor-pointer group shadow-lg hover:shadow-xl flex-shrink-0 w-[140px] snap-start"
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg`}
              >
                <category.icon className="w-6 h-6" />
              </div>

              <div className="text-center flex-1 min-w-0">
                <h4 className="text-[13px] font-black text-gray-950 dark:text-white mb-1 truncate tracking-tight">
                  {t(`categories.${category.id}`)}
                </h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  30+ {t('home.videosCount')}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
