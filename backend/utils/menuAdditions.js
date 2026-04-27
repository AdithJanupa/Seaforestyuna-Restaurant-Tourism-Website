const MENU_ADDITIONS = [
  {
    _id: 'demo-mains-coastal-herb-snapper',
    id: 'demo-mains-coastal-herb-snapper',
    category: 'Mains',
    name: 'Coastal Herb Snapper',
    price: 34
  },
  {
    _id: 'demo-mains-coconut-lemongrass-chicken',
    id: 'demo-mains-coconut-lemongrass-chicken',
    category: 'Mains',
    name: 'Coconut Lemongrass Chicken',
    price: 27
  },
  {
    _id: 'demo-mains-tamarind-beef-short-rib',
    id: 'demo-mains-tamarind-beef-short-rib',
    category: 'Mains',
    name: 'Tamarind Beef Short Rib',
    price: 36
  },
  {
    _id: 'demo-seafood-charcoal-lobster-tail',
    id: 'demo-seafood-charcoal-lobster-tail',
    category: 'Seafood Specials',
    name: 'Charcoal Lobster Tail',
    price: 42
  },
  {
    _id: 'demo-seafood-lagoon-garlic-prawns',
    id: 'demo-seafood-lagoon-garlic-prawns',
    category: 'Seafood Specials',
    name: 'Lagoon Garlic Prawns',
    price: 31
  },
  {
    _id: 'demo-drinks-mangrove-citrus-fizz',
    id: 'demo-drinks-mangrove-citrus-fizz',
    category: 'Drinks',
    name: 'Mangrove Citrus Fizz',
    price: 9
  },
  {
    _id: 'demo-drinks-passionfruit-mint-cooler',
    id: 'demo-drinks-passionfruit-mint-cooler',
    category: 'Drinks',
    name: 'Passionfruit Mint Cooler',
    price: 8
  },
  {
    _id: 'demo-desserts-palm-pudding',
    id: 'demo-desserts-palm-pudding',
    category: 'Desserts',
    name: 'Coconut Palm Pudding',
    price: 8
  },
  {
    _id: 'demo-desserts-sand-dune-tiramisu',
    id: 'demo-desserts-sand-dune-tiramisu',
    category: 'Desserts',
    name: 'Sand Dune Tiramisu',
    price: 12
  }
];

const getMenuAdditions = () => MENU_ADDITIONS.map((item) => ({ ...item }));

module.exports = {
  getMenuAdditions
};
