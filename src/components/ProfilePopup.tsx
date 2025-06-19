import { useRef, useEffect, useState } from 'react'; // ✅ useState ko import kiya
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock, Phone, Shield, FileText, LogOut } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderHistoryClick: () => void;
  onLogoutClick: () => void;
}

// 🔥🔥🔥 REMOVED: Global customerName declaration. Ab yeh state mein manage hoga.
// let customerName: string = ''
// const customerData = localStorage.getItem("customerData")
// if (customerData) {
//   customerName = (JSON.parse(customerData)).name
// }

export const ProfilePopup = ({ isOpen, onClose, onOrderHistoryClick, onLogoutClick }: Props) => {
  const popupRef = useRef<HTMLDivElement>(null);
  // ✅ customerName ko state variable banaya
  const [customerName, setCustomerName] = useState<string>('');

  useEffect(() => {
    // Function jo customer data ko localStorage se update karegi
    const updateCustomerName = () => {
      const customerData = localStorage.getItem("customerData");
      if (customerData) {
        try {
          const parsedCustomerData = JSON.parse(customerData);
          if (parsedCustomerData.name) {
            setCustomerName(parsedCustomerData.name);
          } else {
            setCustomerName(''); // Agar name available nahi hai
          }
        } catch (error) {
          console.error("Error parsing customer data from localStorage in ProfilePopup:", error);
          setCustomerName(''); // Error hone par empty string set karo
        }
      } else {
        setCustomerName(''); // Agar localStorage mein customerData nahi hai
      }
    };

    // Component mount hone par ya isOpen change hone par data update karo
    updateCustomerName();

    // ✅ localStorage changes ko listen karo
    window.addEventListener('storage', updateCustomerName);

    // Click-outside functionality
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', updateCustomerName); // ✅ Event listener ko remove karo
    };
  }, [isOpen, onClose]); // isOpen aur onClose dependency array mein hain

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px]">
          <motion.div
            ref={popupRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 p-4"
          >
            <div 
              className="rounded-[25px] p-6 max-w-xl mx-auto shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20"
              style={{
                background: 'rgba(242, 242, 245, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="space-y-4">
                {/* User Name */}
                <div 
                  className="rounded-[15px] p-4 flex items-center gap-4"
                  style={{
                    background: 'rgba(255, 255, 255, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="w-12 h-12 bg-[#6552FF] rounded-full flex items-center justify-center text-white font-semibold">
                    {/* ✅ customerName state variable ka use karo */}
                    {customerName ? customerName.split('')[0] : ''} 
                  </div>
                  {/* ✅ customerName state variable ka use karo */}
                  <span className="font-semibold">{customerName}</span>
                </div>

                {/* Profile Items */}
                <div className="space-y-2">
                  {[
                    { icon: Clock, text: 'Order History', onClick: onOrderHistoryClick },
                    { icon: Phone, text: 'Contact Us' },
                    { icon: Shield, text: 'Privacy Policies' },
                    { icon: FileText, text: 'Terms and Conditions' },
                    { icon: LogOut, text: 'Logout', className: 'text-red-500', onClick: onLogoutClick }
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      className={`rounded-[15px] p-4 flex items-center gap-3 cursor-pointer hover:bg-white/50 transition-colors ${item.className || ''}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                      onClick={item.onClick}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <item.icon className={item.className || 'text-gray-600'} />
                      <span className="font-light">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4">
                  <span>Made with</span>
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span>by Gormish</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};