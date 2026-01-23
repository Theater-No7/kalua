// ユーザー情報
export type User = {
    id: string; // Firebase AuthのUIDと同じ
    name: string;
    avatarUrl?: string; // LINEのアイコン画像
    currentStoreId?: string; // 最後に開いていた店舗ID
    createdAt: Date;
};

// 店舗情報
export type Store = {
    id: string;
    name: string;
    inviteCode: string; // 招待用コード
    categories: string[]; // カテゴリタグのリスト
    ownerId: string; // 作成者のID
    createdAt: Date;
};

// 店舗メンバー（中間テーブル的な役割）
export type Member = {
    userId: string;
    storeId: string;
    role: 'owner' | 'member'; // オーナーかスタッフか
    joinedAt: Date;
};

// レシピ情報
export type Recipe = {
    id: string;
    storeId: string;
    title: string;
    category: string;
    imageUrl?: string; // 画像は必須ではない
    ingredients: string[]; // 材料リスト
    steps: string[]; // 手順リスト
    description?: string; // コツ・メモ
    updatedAt: Date;
    createdAt: Date;
};

// 既読ログ
export type ReadLog = {
    userId: string;
    recipeId: string;
    readAt: Date;
};