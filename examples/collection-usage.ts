import { Model, Collection } from '../src';
import User from './models/User';
import Post from './models/Post';

// Configuration de la connexion à la base de données
Model.setConnection({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'teloquent_test'
  }
});

async function main() {
  try {
    console.log('Démonstration des Collections dans Teloquent');

    // Récupération de tous les utilisateurs avec la méthode all()
    // Retourne maintenant une Collection au lieu d'un tableau
    const users = await User.all();
    console.log(`Nombre d'utilisateurs: ${users.count()}`);

    // Utilisation des méthodes de Collection
    const activeUsers = users.filter(user => user.active === true);
    console.log(`Nombre d'utilisateurs actifs: ${activeUsers.count()}`);

    // Récupération des posts avec la méthode get() du QueryBuilder
    // Retourne maintenant une Collection au lieu d'un tableau
    const posts = await Post.query().with('user').get();
    console.log(`Nombre de posts: ${posts.count()}`);

    // Utilisation des méthodes de manipulation de Collection
    const sortedPosts = posts.sortBy('title');
    console.log('Posts triés par titre:');
    sortedPosts.each(post => {
      console.log(`- ${post.title} (par ${post.user.name})`);
    });

    // Regroupement par auteur
    const postsByAuthor = posts.groupBy(post => post.user.name);
    console.log('Posts regroupés par auteur:');
    for (const [author, authorPosts] of Object.entries(postsByAuthor)) {
      console.log(`${author} (${authorPosts.length} posts):`);
      authorPosts.forEach(post => {
        console.log(`  - ${post.title}`);
      });
    }

    // Extraction de propriétés spécifiques
    const titles = posts.pluck('title');
    console.log('Titres des posts:', titles);

    // Calculs sur les collections
    const averagePostLength = posts
      .map(post => post.content.length)
      .avg();
    console.log(`Longueur moyenne des posts: ${averagePostLength} caractères`);

    // Pagination avec chunk
    console.log('\nPagination avec chunk:');
    await Post.query().chunk(2, async (items, page) => {
      console.log(`Page ${page} - ${items.count()} éléments:`);
      items.each(post => {
        console.log(`- ${post.title}`);
      });
    });

    // Création d'une collection à partir d'un tableau
    const newPosts = [
      new Post({ title: 'Nouveau post 1', content: 'Contenu 1' }),
      new Post({ title: 'Nouveau post 2', content: 'Contenu 2' })
    ];
    
    const postsCollection = Model.newCollection(newPosts);
    console.log(`\nNouvelle collection créée avec ${postsCollection.count()} posts`);
    
    // Transformation en JSON
    console.log('\nTransformation en JSON:');
    console.log(JSON.stringify(postsCollection.toJSON(), null, 2));

  } catch (error) {
    console.error('Erreur:', error);
  }
}

main();
