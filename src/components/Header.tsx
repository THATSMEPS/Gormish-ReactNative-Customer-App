// components/Header.tsx

// import { motion, AnimatePresence } from 'framer-motion'; // Not directly used in Header component's motion
import { Navbar } from './Navbar';
import { SearchBar } from './SearchBar';
// import { Categories } from './Categories';
// import '../styles/Header.css'; // Agar yeh file ab bhi needed hai toh rakh sakte ho

interface HeaderProps {
  headerBackground: any;
  selectedArea: string;
  selectedCategory: string | null;
  onLocationClick: () => void;
  onProfileClick: () => void;
  onTrackOrder: () => void;
  onCategorySelect: (category: string | null) => void;
  // ✅ NEW PROPS FOR SEARCH
  searchText: string;
  onSearchChange: (text: string) => void;
}

export const Header = ({
  headerBackground,
  selectedArea,
  // selectedCategory,
  onLocationClick,
  onProfileClick,
  onTrackOrder,
  // onCategorySelect,
  searchText, // ✅ NEW: Destructure searchText
  onSearchChange, // ✅ NEW: Destructure onSearchChange
}: HeaderProps) => {
  return (
    <header
      style={{ backgroundColor: headerBackground }}
      className="sticky top-0 z-40 backdrop-blur-sm bg-slate-50/40"
    >
      <div>
        <Navbar 
          onLocationClick={onLocationClick}
          onProfileClick={onProfileClick}
          onTrackOrder={onTrackOrder}
          selectedArea={selectedArea}
        />
      </div>
      
      <div>
        {/* ✅ UPDATED: Pass searchText and onSearchChange to SearchBar */}
        <SearchBar 
          searchText={searchText} 
          onSearchChange={onSearchChange} 
        />
        {/* <Categories 
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
        /> */}
      </div>
    </header>
  );
};