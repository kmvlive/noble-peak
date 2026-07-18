export interface Activity {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  price: number;
  imageGradient: string;
  likes: number;
  isPopular: boolean;
}

export const activities: Activity[] = [
  {
    id: "gornyj-pohod",
    title: "Горный поход на Ай-Петри",
    shortDescription:
      "Однодневный треккинг по живописным тропам Крымских гор с обедом на вершине.",
    category: "Треккинг",
    price: 3500,
    imageGradient: "from-emerald-400 to-cyan-500",
    likes: 48,
    isPopular: true,
  },
  {
    id: "morskaja-progulka",
    title: "Морская прогулка на яхте",
    shortDescription: "Вечерний круиз вдоль побережья с шампанским и закатом.",
    category: "Водные",
    price: 5500,
    imageGradient: "from-blue-400 to-indigo-500",
    likes: 72,
    isPopular: true,
  },
  {
    id: "master-klass-gotovki",
    title: "Мастер-класс по итальянской кухне",
    shortDescription:
      "Научитесь готовить пасту и тирамису под руководством шеф-повара.",
    category: "Гастрономия",
    price: 4200,
    imageGradient: "from-orange-400 to-rose-500",
    likes: 35,
    isPopular: false,
  },
  {
    id: "konnaja-progulka",
    title: "Конная прогулка по лесу",
    shortDescription:
      "Верховая езда по живописным лесным тропам для опытных и новичков.",
    category: "Активный отдых",
    price: 2800,
    imageGradient: "from-amber-500 to-yellow-400",
    likes: 29,
    isPopular: true,
  },
  {
    id: "rafting",
    title: "Рафтинг по горной реке",
    shortDescription: "Экстремальный сплав по порогам категории сложности 3+.",
    category: "Водные",
    price: 3900,
    imageGradient: "from-cyan-400 to-teal-500",
    likes: 56,
    isPopular: true,
  },
  {
    id: "ekskursija-po-gorodu",
    title: "Обзорная экскурсия по Старому городу",
    shortDescription:
      "Пешеходная экскурсия с гидом по главным достопримечательностям.",
    category: "Экскурсии",
    price: 1800,
    imageGradient: "from-stone-400 to-zinc-500",
    likes: 41,
    isPopular: false,
  },
  {
    id: "degustacija-vina",
    title: "Винная дегустация в долине",
    shortDescription: "Дегустация 6 сортов местного вина с сырной тарелкой.",
    category: "Гастрономия",
    price: 3200,
    imageGradient: "from-purple-400 to-violet-500",
    likes: 63,
    isPopular: true,
  },
  {
    id: "dajving",
    title: "Дайвинг у кораллового рифа",
    shortDescription:
      "Погружение с инструктором в самом чистом месте побережья.",
    category: "Водные",
    price: 6800,
    imageGradient: "from-sky-400 to-blue-600",
    likes: 38,
    isPopular: false,
  },
  {
    id: "kvest-komnata",
    title: "Квест-комната «Сокровища пиратов»",
    shortDescription: "Командный квест с загадками и поиском сокровищ.",
    category: "Развлечения",
    price: 2500,
    imageGradient: "from-red-400 to-pink-500",
    likes: 22,
    isPopular: false,
  },
  {
    id: "parashjut",
    title: "Прыжок с парашютом",
    shortDescription: "Тандем-прыжок с инструктором с высоты 4000 метров.",
    category: "Экстрим",
    price: 8500,
    imageGradient: "from-orange-400 to-red-500",
    likes: 81,
    isPopular: true,
  },
];

export const latestActivities = activities.slice(0, 5);

export const popularActivities = activities.filter((a) => a.isPopular);
