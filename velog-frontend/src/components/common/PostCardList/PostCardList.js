// @flow
import React, { Fragment } from 'react';
import PostCard from 'components/common/PostCard';
import type { PostItem } from 'store/modules/listing';
import FakePostCard from 'components/common/FakePostCard';
import './PostCardList.scss';

type Props = {
  posts?: ?(PostItem[]),
  loading: boolean,
  prefetching: boolean,
  width: number,
  hasEnded: boolean,
};

const createArray = length => Array.from(Array(length).keys());
const getColumnCount = (width) => {
  const xWide = 1920;
  const wide = 1600;
  const xLarge = 1200;
  const large = 1024;

  if (width < large) return 1;
  if (width < xLarge) return 2;
  if (width < wide) return 3;
  if (width < xWide) return 4;
  return 5;
};

const PostCardList = ({ posts, loading, prefetching, width, hasEnded }: Props) => {
  if (loading) {
    return (
      <div className="PostCardList">{createArray(10).map(num => <FakePostCard key={num} />)}</div>
    );
  }

  const columnCount = getColumnCount(width);

  if (!posts) return null;
  const postList = (hasEnded
    ? posts
    : posts.slice(0, posts.length - posts.length % columnCount)
  ).map(post => (
    <PostCard
      key={post.id}
      thumbnail={post.thumbnail}
      username={post.user.username}
      title={post.title}
      body={post.body}
      date={post.created_at}
    />
  ));
  return (
    <Fragment>
      <div className="PostCardList">
        {postList}
        {prefetching && createArray(columnCount).map(num => <FakePostCard key={num} />)}
      </div>
    </Fragment>
  );
};

PostCardList.defaultProps = {
  posts: [],
};

export default PostCardList;
