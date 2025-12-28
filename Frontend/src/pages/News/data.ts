export type Category = 'world' | 'business' | 'art' | 'student';

export type NewsItem = {
  id: string;
  title: string;
  text: string;
  category: Category;
};

export const news: NewsItem[] = [
  {
    id: '1',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '2',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '3',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '4',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '5',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '5',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '5',
    title: 'Новость мира',
    text: 'Текст новости мира',
    category: 'world',
  },
  {
    id: '6',
    title: 'Новость бизнеса',
    text: 'Текст бизнеса',
    category: 'business',
  },
  {
    id: '7',
    title: 'Новость бизнеса',
    text: 'Текст бизнеса',
    category: 'business',
  },
  {
    id: '8',
    title: 'Новость искусства',
    text: 'Текст искусства',
    category: 'art',
  },
  {
    id: '9',
    title: 'Новость сайта',
    text: 'Текст сайта',
    category: 'student',
  },
  {
    id: '10',
    title: 'Новость сайта',
    text: 'Текст сайта',
    category: 'student',
  },
  {
    id: '11',
    title: 'Новость сайта',
    text: 'Текст сайта',
    category: 'student',
  },
  {
    id: '12',
    title: 'Новость сайта',
    text: 'Текст сайта',
    category: 'student',
  },
];
