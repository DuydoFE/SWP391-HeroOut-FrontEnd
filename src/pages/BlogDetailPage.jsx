import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Breadcrumb from "../components/Breadcrumb";
import ApiService from "../services/apiService";

const BlogDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true);

        // Fetch the specific blog post
        const foundPost = await ApiService.getBlog(id);
        setPost(foundPost);

        // Fetch all blog posts to find related ones
        const allPosts = await ApiService.getBlogs();

        // Find related posts (same category, different ID)
        const related = allPosts
          .filter(
            (p) =>
              p.id !== Number.parseInt(id) &&
              p.category.toLowerCase() === foundPost.category.toLowerCase()
          )
          .slice(0, 3);
        setRelatedPosts(related);

        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching blog post:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlogPost();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || "Bài viết không tồn tại"}
          </h1>
          <Link to="/blogs" className="text-emerald-600 hover:text-emerald-700">
            ← Quay lại danh sách bài viết
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div data-aos="fade-down" data-aos-delay="100">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Blogs", href: "/blogs" },
            { label: post.title, truncate: true },
          ]}
        />
      </div>

      {/* Blog Post Image */}
      <div
        className="container mx-auto px-4 mb-8"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        <img
          src={post.image || "/placeholder.svg"}
          alt={post.title}
          className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Article Content */}
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-8" data-aos="fade-up" data-aos-delay="300">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full">
                  {post.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {post.description}
              </p>

              {/* Author Info */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-t border-b border-gray-200 py-6">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                    {post.author.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {post.author.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{post.author.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {post.date}
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {post.readTime}
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {post.views}
                  </span>
                </div>
              </div>
            </header>

            {/* Article Body */}
            <div
              className="prose prose-lg max-w-none"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div
                className="mt-8 pt-8 border-t border-gray-200"
                data-aos="fade-up"
                data-aos-delay="500"
              >
                <h3 className="text-lg font-semibold mb-4">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            {post.author.bio && (
              <div
                className="mt-12 p-6 bg-gray-50 rounded-lg"
                data-aos="fade-up"
                data-aos-delay="600"
              >
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-xl mr-4 flex-shrink-0">
                    {post.author.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {post.author.name}
                    </h3>
                    <p className="text-emerald-600 font-medium mb-3">
                      {post.author.role}
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      {post.author.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2
                className="text-2xl font-bold text-gray-900 mb-8"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                Bài viết liên quan
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost, index) => (
                  <div
                    key={relatedPost.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                    data-aos="fade-up"
                    data-aos-delay={200 + index * 100}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={relatedPost.image || "/placeholder.svg"}
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {relatedPost.category}
                      </span>
                      <h3 className="text-lg font-bold mt-2 mb-3 line-clamp-2">
                        <Link
                          to={`/blogs/${relatedPost.id}`}
                          className="hover:text-emerald-600 transition-colors"
                        >
                          {relatedPost.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {relatedPost.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{relatedPost.author.name}</span>
                        <span>{relatedPost.readTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogDetailPage;