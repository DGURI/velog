// @flow
import Joi from 'joi';
import type { Context, Middleware } from 'koa';
import db from 'database/db';
import Comment, { type WriteParams } from 'database/models/Comment';
import { validateSchema } from 'lib/common';


export const writeComment: Middleware = async (ctx: Context) => {
  type BodySchema = {
    text: string,
    reply_to: string
  };

  const schema = Joi.object().keys({
    text: Joi.string().min(1).max(1000).required(),
    reply_to: Joi.string().uuid(),
  });

  if (!validateSchema(ctx, schema)) {
    return;
  }

  const {
    text,
    reply_to: replyTo,
  }: BodySchema = (ctx.request.body: any);

  // if user is replying to another comment,
  let level = 0;
  let processedReplyTo = replyTo;
  if (replyTo) {
    // check that it exists
    try {
      const c = await Comment.findById(replyTo);
      if (!c) {
        ctx.status = 404;
        ctx.body = {
          name: 'COMMENT_NOT_FOUND',
        };
        return;
      }
      level = c.level + 1;
      if (level === 4) {
        level = 3; // downgrade
        processedReplyTo = c.reply_to;
      } else {
        processedReplyTo = replyTo;
        c.has_reply = true;
      }
      await c.update({
        has_replies: true,
      });
    } catch (e) {
      ctx.throw(500, e);
    }
  }

  const postId = ctx.post.id;
  const userId = ctx.user.id;

  try {
    const comment = await Comment.write({
      postId, userId, text, replyTo: processedReplyTo, level,
    });
    if (!comment) {
      ctx.status = 500;
      return;
    }
    const commentWithUsername = await Comment.readComment(comment.id);
    ctx.body = commentWithUsername;
  } catch (e) {
    ctx.throw(e);
  }
};


export const getCommentList: Middleware = async (ctx: Context) => {
  const postId = ctx.post.id;
  const { offset = 0 } = ctx.query;

  console.log(offset);
  try {
    const { data, count } = await Comment.listComments({
      postId,
      offset,
    });
    const link = `<${ctx.path}?offset=${parseInt(offset, 10) + 20}>; rel="next";`;
    if (count >= offset + 20) {
      ctx.set('Link', link);
    }
    ctx.body = data;
  } catch (e) {
    throw e;
  }
};


export const getReplies: Middleware = async (ctx: Context) => {
  const postId = ctx.post.id;
  const { commentId } = ctx.params;
  try {
    const comments = await Comment.listComments({
      postId,
      replyTo: commentId,
    });
    const link = `<${ctx.path}>; rel="next";`;
    console.log(link);
    ctx.body = comments.data;
  } catch (e) {
    ctx.throw(500, e);
  }
};
