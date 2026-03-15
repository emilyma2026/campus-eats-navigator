import React from 'react';
import { ThumbsUp, MessageCircle, Users, PenLine, MapPin, ShoppingCart, Pin } from 'lucide-react';
import { POIRestaurant } from './AMapContainer';

interface MomentPost {
  id: string;
  user: string;
  avatar: string;
  time: string;
  content: string;
  shopName: string;
  groupBuy?: { slots: number; filled: number };
  likes: number;
  comments: number;
  tags: string[];
}

// Moment templates — shopName will be overridden with a real loaded restaurant name
// so that "在地图上看" navigation is always guaranteed to find a match.
const MOMENT_TEMPLATES = [
  {
    id: 'p1', user: '金融系大三 Linda', avatar: 'L', time: '10分钟前',
    content: '这家份量超足！学生证打 8 折，强烈安利给大家 😍',
    groupBuy: { slots: 3, filled: 2 },
    likes: 42, comments: 8, tags: ['学生优惠', '性价比'],
  },
  {
    id: 'p2', user: '管理系研一 Kevin', avatar: 'K', time: '1小时前',
    content: '下午 2 点下课去，居然没排队！错峰吃真的爽 😂',
    likes: 31, comments: 5, tags: ['错峰打卡', '实惠'],
  },
  {
    id: 'p3', user: '经济系 小美', avatar: '美', time: '昨天',
    content: '期末周神店！插座多、Wi-Fi 快，适合通宵刷题 📚',
    groupBuy: { slots: 4, filled: 1 },
    likes: 89, comments: 23, tags: ['学习打卡', '续命'],
  },
  {
    id: 'p4', user: '信工 Alex', avatar: 'A', time: '2天前',
    content: '老板超 nice，份量给的足，性价比拉满！强推给周边同学',
    likes: 57, comments: 12, tags: ['隐藏美食', '新发现'],
  },
];

interface Props {
  restaurants: POIRestaurant[];
  onViewShop: (shopName: string) => void;
}

export default function CommunityTab({ restaurants, onViewShop }: Props) {
  // Use real restaurant names in posts so navigation always finds a map match.
  // Fall back to generic names only when no restaurants are loaded yet.
  const FALLBACK_NAMES = ['周边餐厅A', '周边餐厅B', '周边餐厅C', '周边餐厅D'];
  const moments = MOMENT_TEMPLATES.map((tpl, i) => ({
    ...tpl,
    shopName: restaurants[i + 2]?.name ?? restaurants[i]?.name ?? FALLBACK_NAMES[i],
  }));

  // Derive 2 pinned group-buy posts from real nearby restaurants (or fall back to mock names)
  const pinnedGroupBuys = (() => {
    const sources = restaurants.length >= 2
      ? restaurants.slice(0, 2).map((r) => ({ shopName: r.name, distanceM: r.distance }))
      : [
          { shopName: '瑞幸咖啡(五角场)', distanceM: 80 },
          { shopName: '张亮麻辣烫',       distanceM: 150 },
        ];
    return sources.map((s, i) => ({
      ...s,
      slots:  3 + i,
      filled: 1 + i,
      user:   ['经济系组团', '管院同学群'][i],
      content: `拼单 ${3 + i} 人，已有 ${1 + i} 人，还差 ${2} 人就出发！`,
    }));
  })();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">同学说</h1>
            <p className="text-xs text-muted-foreground mt-0.5">真实学生的美食动态</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-[#FFD000]/10 px-3 py-1.5 rounded-full">
            <Users size={13} /> 328 位同学
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3">

        {/* ── Pinned Group Buys ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
            <Pin size={12} /> 拼单进行中
          </div>
          {pinnedGroupBuys.map((gb, i) => (
            <div key={i} className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <button
                    onClick={() => onViewShop(gb.shopName)}
                    className="text-sm font-bold text-orange-700 hover:underline text-left"
                  >
                    {gb.shopName}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5">{gb.user}</p>
                </div>
                <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">
                  拼单
                </span>
              </div>

              <p className="text-xs text-orange-800 mb-2.5">{gb.content}</p>

              <div className="flex items-center justify-between">
                {/* Progress bar */}
                <div className="flex-1 mr-3">
                  <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${(gb.filled / gb.slots) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {gb.filled}/{gb.slots} 人
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <MapPin size={10} /> {gb.distanceM}m
                  </span>
                  <button className="flex items-center gap-1 text-xs font-bold bg-orange-500 text-white px-2.5 py-1 rounded-lg hover:bg-orange-600 transition-colors">
                    <ShoppingCart size={11} /> 加入
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Moments Feed ────────────────────────────────────────────────── */}
        {moments.map((post) => (
          <div key={post.id} className="bg-card rounded-2xl p-4 border border-border shadow-card">

            {/* User row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FFD000]/30 flex items-center justify-center font-bold text-sm shrink-0">
                  {post.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold">{post.user}</p>
                  <p className="text-[11px] text-muted-foreground">{post.time}</p>
                </div>
              </div>
              {post.groupBuy && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full shrink-0">
                  <ShoppingCart size={9} /> 拼单 {post.groupBuy.filled}/{post.groupBuy.slots}
                </span>
              )}
            </div>

            {/* Content */}
            <p className="text-sm leading-relaxed mb-2">{post.content}</p>

            {/* Linked shop name */}
            <button
              onClick={() => onViewShop(post.shopName)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#B8860B] bg-[#FFD000]/10 px-2.5 py-1 rounded-full hover:bg-[#FFD000]/20 transition-colors mb-3"
            >
              <MapPin size={10} /> {post.shopName} →
            </button>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-secondary text-xs font-medium rounded-full text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 text-muted-foreground border-t border-border pt-3">
              <button className="flex items-center gap-1.5 text-xs hover:text-[#FFD000] transition-colors">
                <ThumbsUp size={13} /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-xs hover:text-[#FFD000] transition-colors">
                <MessageCircle size={13} /> {post.comments}
              </button>
            </div>
          </div>
        ))}

        {/* Write CTA */}
        <div className="rounded-2xl border-2 border-dashed border-[#FFD000]/40 p-6 text-center">
          <PenLine size={24} className="mx-auto mb-2 text-[#FFD000]/60" />
          <p className="text-sm font-semibold mb-1">分享你的发现</p>
          <p className="text-xs text-muted-foreground mb-3">帮助其他同学找到好吃的</p>
          <button className="px-6 py-2 bg-[#FFD000] text-black text-sm font-bold rounded-xl hover:bg-yellow-400 transition-colors">
            写一篇分享
          </button>
        </div>
      </div>
    </div>
  );
}
