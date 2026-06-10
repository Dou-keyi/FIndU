// useKeyboardShortcuts.js — document-level keyboard shortcut handler for the feed
import { useEffect } from 'react';
import { useFeedStore } from '../store/feedStore';

export function useKeyboardShortcuts() {
  const setComposerOpen = useFeedStore((s) => s.setComposerOpen);
  const focusNext = useFeedStore((s) => s.focusNext);
  const focusPrev = useFeedStore((s) => s.focusPrev);
  const focusedIndex = useFeedStore((s) => s.focusedIndex);
  const posts = useFeedStore((s) => s.posts);
  const toggleComments = useFeedStore((s) => s.toggleComments);
  const setShortcutsModalOpen = useFeedStore((s) => s.setShortcutsModalOpen);

  useEffect(() => {
    function handleKeyDown(e) {
      // Skip if user is typing in an input/textarea/contenteditable
      const tag = e.target.tagName;
      const editable = e.target.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          setComposerOpen(true);
          break;

        case 'j':
          e.preventDefault();
          focusNext();
          break;

        case 'k':
          e.preventDefault();
          focusPrev();
          break;

        case 'l': {
          e.preventDefault();
          // Dispatch custom event that PostCard listens for
          const postId = posts[focusedIndex]?.id;
          if (postId) {
            window.dispatchEvent(new CustomEvent('feed:react', { detail: { postId } }));
          }
          break;
        }

        case 'r': {
          e.preventDefault();
          const postId = posts[focusedIndex]?.id;
          if (postId) toggleComments(postId);
          break;
        }

        case 'b': {
          e.preventDefault();
          const postId = posts[focusedIndex]?.id;
          if (postId) {
            window.dispatchEvent(new CustomEvent('feed:bookmark', { detail: { postId } }));
          }
          break;
        }

        case '/':
          e.preventDefault();
          document.getElementById('feed-search-input')?.focus();
          break;

        case '?':
          if (!e.shiftKey) break;
          e.preventDefault();
          setShortcutsModalOpen(true);
          break;

        default:
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, posts, setComposerOpen, focusNext, focusPrev, toggleComments, setShortcutsModalOpen]);
}
