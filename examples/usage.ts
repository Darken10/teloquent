/**
 * Exemple d'utilisation de Teloquent
 * 
 * Ce fichier montre comment utiliser Teloquent dans une application réelle.
 */

import { initialize } from '../src';
import User from './models/User';
import Post from './models/Post';

// Initialiser la connexion à la base de données
initialize('development');

async function main() {
  try {
    console.log('Démonstration de Teloquent ORM');
    console.log('=============================\n');

    // Créer un utilisateur
    console.log('Création d\'un utilisateur...');
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    console.log(`Utilisateur créé avec l'ID: ${user.id}`);
    console.log(user.toJSON());
    console.log('');

    // Créer des posts pour l'utilisateur
    console.log('Création de posts pour l\'utilisateur...');
    const post1 = await user.posts.create({
      title: 'Premier post',
      content: 'Contenu du premier post',
      published: true
    });

    const post2 = await user.posts.create({
      title: 'Deuxième post',
      content: 'Contenu du deuxième post',
      published: false
    });

    console.log(`Posts créés avec les IDs: ${post1.id}, ${post2.id}`);
    console.log('');

    // Récupérer tous les posts de l'utilisateur
    console.log('Récupération de tous les posts de l\'utilisateur...');
    const posts = await user.posts.get();
    console.log(`L'utilisateur a ${posts.length} posts:`);
    posts.forEach(post => {
      console.log(`- ${post.title} (${post.published ? 'Publié' : 'Non publié'})`);
    });
    console.log('');

    // Récupérer un post par ID
    console.log('Récupération d\'un post par ID...');
    const foundPost = await Post.find(post1.id);
    if (foundPost) {
      console.log(`Post trouvé: ${foundPost.title}`);
      console.log(`Extrait: ${foundPost.excerpt(20)}`);
    }
    console.log('');

    // Récupérer tous les utilisateurs avec leurs posts (eager loading)
    console.log('Récupération de tous les utilisateurs avec leurs posts (eager loading)...');
    const usersWithPosts = await User.query().with('posts').get();
    usersWithPosts.forEach(u => {
      console.log(`${u.name} a ${u.getRelation('posts').length} posts`);
    });
    console.log('');

    // Utiliser un scope pour récupérer uniquement les posts publiés
    console.log('Récupération des posts publiés uniquement...');
    const publishedPosts = await Post.published().get();
    console.log(`${publishedPosts.length} posts publiés trouvés`);
    console.log('');

    // Mettre à jour un post
    console.log('Mise à jour d\'un post...');
    post2.title = 'Deuxième post (mis à jour)';
    post2.published = true;
    await post2.save();
    console.log(`Post mis à jour: ${post2.title} (${post2.published ? 'Publié' : 'Non publié'})`);
    console.log('');

    // Compter les posts publiés
    console.log('Comptage des posts publiés...');
    const publishedCount = await Post.query().where('published', true).count();
    console.log(`Nombre de posts publiés: ${publishedCount}`);
    console.log('');

    // Soft delete d'un post
    console.log('Suppression douce d\'un post...');
    await post1.delete();
    console.log(`Post ${post1.id} supprimé (soft delete)`);
    console.log('');

    // Récupérer les posts incluant les supprimés
    console.log('Récupération de tous les posts (incluant les supprimés)...');
    const allPosts = await Post.query().withTrashed().get();
    console.log(`${allPosts.length} posts trouvés (incluant les supprimés)`);
    allPosts.forEach(post => {
      console.log(`- ${post.title} (${post.deleted_at ? 'Supprimé' : 'Actif'})`);
    });
    console.log('');

    // Restaurer un post supprimé
    console.log('Restauration d\'un post supprimé...');
    await post1.restore();
    console.log(`Post ${post1.id} restauré`);
    console.log('');

    // Supprimer définitivement un post
    console.log('Suppression définitive d\'un post...');
    await post1.forceDelete();
    console.log(`Post ${post1.id} supprimé définitivement`);
    console.log('');

    // Utiliser le query builder avancé
    console.log('Utilisation du query builder avancé...');
    const complexQuery = await Post.query()
      .where('published', true)
      .orWhere(query => query.where('user_id', user.id).where('title', 'like', '%mis à jour%'))
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();
    
    console.log(`${complexQuery.length} posts trouvés avec la requête complexe`);
    console.log('');

    console.log('Démonstration terminée!');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction principale
main().catch(console.error);
