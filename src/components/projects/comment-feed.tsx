"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
} from "@/lib/actions/task-comments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Reply, Pencil, Trash2 } from "lucide-react";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: Author;
  createdAt: Date | string;
  updatedAt: Date | string;
  replies?: Comment[];
}

interface CommentFeedProps {
  taskId: string;
  comments: Comment[];
  currentUserId: string;
  onUpdated: () => void;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CommentItem({
  comment,
  taskId,
  currentUserId,
  onUpdated,
  isReply = false,
}: {
  comment: Comment;
  taskId: string;
  currentUserId: string;
  onUpdated: () => void;
  isReply?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const isOwn = comment.authorId === currentUserId;

  async function handleReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await createTaskComment(taskId, replyText, comment.id);
    setReplyText("");
    setReplying(false);
    setSubmitting(false);
    onUpdated();
  }

  async function handleEdit() {
    if (!editText.trim()) return;
    setSubmitting(true);
    await updateTaskComment(comment.id, editText);
    setEditing(false);
    setSubmitting(false);
    onUpdated();
  }

  async function handleDelete() {
    await deleteTaskComment(comment.id);
    onUpdated();
  }

  return (
    <div className={isReply ? "ml-8" : ""}>
      <div className="flex gap-2.5 group">
        <Avatar className="h-6 w-6 mt-0.5 shrink-0">
          <AvatarFallback className="text-[10px]">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">
              {comment.author.name ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.createdAt)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger className="ml-auto h-5 w-5 inline-flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
                <MoreHorizontal className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isReply && (
                  <DropdownMenuItem onClick={() => setReplying(true)}>
                    <Reply className="h-3.5 w-3.5 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {isOwn && (
                  <>
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={submitting || !editText.trim()}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setEditText(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          taskId={taskId}
          currentUserId={currentUserId}
          onUpdated={onUpdated}
          isReply
        />
      ))}

      {/* Reply input */}
      {replying && (
        <div className="ml-8 mt-2 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
            >
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplying(false);
                setReplyText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommentFeed({
  taskId,
  comments,
  currentUserId,
  onUpdated,
}: CommentFeedProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    await createTaskComment(taskId, newComment);
    setNewComment("");
    setSubmitting(false);
    onUpdated();
  }

  return (
    <div className="space-y-4">
      {/* New comment input */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[60px] text-sm"
        />
        {newComment.trim() && (
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Comment"}
            </Button>
          </div>
        )}
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No comments yet
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              currentUserId={currentUserId}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
