import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Props {
  onContinue: () => void;
}

export const PaymentSuccessScreen = ({ onContinue }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="fixed inset-0 bg-[#F2F2F5] flex items-center justify-center">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="w-24 h-24 bg-[#6552FF] rounded-full flex items-center justify-center mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Check size={48} className="text-white" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold">Payment Successful!</h2>
          <p className="text-gray-600">Your order is being prepared</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.6,
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          className="flex justify-center space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-3 h-3 bg-[#6552FF] rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};