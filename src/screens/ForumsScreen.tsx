import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Forum, Search, AddCircle, ChevronRight, CheckCircle, Close } from '../components/Icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn, parseJsonResponse } from '../lib/utils';

const INITIAL_POSTS = [
  { id: 1, title: 'Best pesticide for Tomato Blight?', author: 'Farmer John', replies: 12, time: '2h ago', tags: ['Pests', 'Tomato'], liked: false },
  { id: 2, title: 'New irrigation technique for Sector B', author: 'AgroExpert', replies: 8, time: '5h ago', tags: ['Irrigation', 'Efficiency'], liked: true },
  { id: 3, title: 'Wheat harvesting season tips', author: 'Yash', replies: 24, time: '1d ago', tags: ['Wheat', 'Harvest'], liked: false },
];
import { useAuth } from '../hooks/useAuth';

export const ForumsScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', tags: '' });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadPosts() {
      try {
        const resp = await fetch('/api/forums/posts?page=1');
        if (!resp.ok) throw new Error('Failed to fetch posts');
        const data = await parseJsonResponse<any>(resp);
        const items = data?.posts && Array.isArray(data.posts) ? data.posts : [];
        setPosts(items.map((p: any) => ({
            ...p,
            author: p.user_id === user?.id ? 'You' : 'Farmer', // Minimal mock until profiles expand
            time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Just now',
            tags: p.crop_type ? [p.crop_type, p.district].filter(Boolean) : ['General'],
            replies: p.upvotes || 0 // use upvotes for replies column as placeholder
        })));
      } catch (err) {
        console.error(err);
        setPosts(INITIAL_POSTS);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [user]);

  const handleCreatePost = async () => {
    if (!newPost.title) return;
    try {
      const resp = await fetch('/api/forums/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             title: newPost.title,
             body: newPost.tags || 'No description provided.',
             district: 'Maharashtra', // Demo default
             user_id: user?.id
          })
      });
      if (!resp.ok) throw new Error('Failed to create post');
      const post = await parseJsonResponse<any>(resp);
      if (post) {
        setPosts([{ 
            ...post, 
            author: 'You', 
            time: 'Just now', 
            tags: ['New'],
            replies: 0
        }, ...posts]);
      }
      setIsPosting(false);
      setNewPost({ title: '', tags: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title && p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('forums')} setScreen={setScreen} activeScreen="forums" />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full scrollbar-hide">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">{t('community_forums')}</h2>
            <p className="text-on-surface-variant max-w-xl mt-2">{t('community_forums_subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsPosting(true)}
            className="signature-gradient text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:opacity-90 active:scale-95 transition-all"
          >
            <AddCircle className="w-6 h-6" />
            {t('start_discussion')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-2xl mb-12 group">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center bg-surface-container-low border border-emerald-900/5 rounded-full pl-6 pr-4 py-1">
             <Search className="text-outline w-5 h-5 mr-4" />
             <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('search_forums')}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4"
             />
          </div>
        </div>

        {/* Posts List */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div 
                layout
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest p-8 rounded-[2rem] border border-emerald-900/5 hover:border-emerald-900/10 hover:shadow-lg transition-all cursor-pointer group flex flex-col md:flex-row gap-8 items-start md:items-center"
              >
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800 shadow-inner">
                  <Forum className="w-8 h-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-headline font-bold text-2xl text-emerald-900 group-hover:text-primary transition-colors leading-tight">{post.title}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold">
                            {post.author[0]}
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">by {post.author}</span>
                    </div>
                    <span className="text-outline">•</span>
                    <span className="text-xs text-outline font-medium">{post.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="flex flex-col items-center p-3 rounded-xl bg-surface-container/50">
                        <span className="text-lg font-headline font-black text-primary">{post.replies}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">{t('replies')}</span>
                    </div>
                    <ChevronRight className="w-6 h-6 text-outline group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-surface-container-low/50 rounded-[3rem] border border-dashed border-outline-variant/20">
                <Forum className="w-16 h-16 text-outline/20 mx-auto mb-4" />
                <p className="text-on-surface-variant font-medium">{t('no_discussions_found')}</p>
            </div>
          )}
        </div>
      </div>

      {/* New Post Component */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setIsPosting(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                  <Close className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-3xl font-headline font-extrabold text-primary mb-2">{t('new_topic')}</h3>
              <p className="text-on-surface-variant mb-8 font-medium">{t('new_topic_subtitle')}</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-outline ml-1">{t('title')}</label>
                  <input 
                    type="text" 
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder={t('example_post_title')}
                    className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-outline ml-1">{t('tags_comma_separated')}</label>
                  <input 
                    type="text" 
                    value={newPost.tags}
                    onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                    placeholder={t('example_tags')}
                    className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <button 
                  onClick={handleCreatePost}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all mt-4"
                >
                  {t('publish_discussion')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
