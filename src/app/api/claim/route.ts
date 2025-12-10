import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getAccount, 
  TokenAccountNotFoundError, 
  TokenInvalidAccountOwnerError 
} from '@solana/spl-token';
import bs58 from 'bs58';

// MGT 代币合约地址
const MGT_MINT = new PublicKey("59eXaVJNG441QW54NTmpeDpXEzkuaRjSLm8M6N4Gpump");
// MGT 的精度 (Decimals)，通常是 6 或 9，请去区块浏览器确认！这里假设是 6
const DECIMALS = 6; 

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();

    if (!wallet) return NextResponse.json({ error: 'Wallet required' }, { status: 400 });

    // 1. 初始化 Supabase (Service Role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. 查询用户待领余额
    const { data: user, error } = await supabase
      .from('users')
      .select('pending_reward, referrals_count')
      .eq('wallet', wallet)
      .single();

    if (error || !user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const amountToClaim = user.pending_reward;

    // 🛡️ 最小提现门槛 (防止 0.00001 这种粉尘攻击消耗 Gas)
    if (amountToClaim < 1) { // 例如：至少攒够 1 个 MGT 才能提
      return NextResponse.json({ error: '余额不足 1 MGT，继续努力！' }, { status: 400 });
    }

    // 3. 初始化 Solana 连接和国库钱包
    // 使用 Helius 的 RPC 节点以保证速度 (或者用公用的 mainnet-beta)
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    
    // 从环境变量读取私钥
    const secretKeyString = process.env.PAYER_PRIVATE_KEY!;
    if (!secretKeyString) throw new Error("服务器未配置私钥");

    const payer = Keypair.fromSecretKey(bs58.decode(secretKeyString));

    console.log(`正在处理提现: ${wallet} 提取 ${amountToClaim} MGT`);

    // 4. 构建转账交易
    const destinationWallet = new PublicKey(wallet);
    
    // 获取国库的 Token 账户 (源头)
    const sourceTokenAccount = await getAssociatedTokenAddress(MGT_MINT, payer.publicKey);
    
    // 获取用户的 Token 账户 (目的地)
    const destTokenAccount = await getAssociatedTokenAddress(MGT_MINT, destinationWallet);

    const transaction = new Transaction();

    // 检查用户是否有 Token 账户，如果没有，其实 SPL Transfer 会报错
    // 为了简化，我们假设用户钱包（像 Phantom）会自动处理 ATA，或者我们直接转账
    // 这里的 createTransferInstruction 会尝试转给 ATA
    
    // ⚠️ 注意：如果用户从来没持有过 MGT，可能需要先创建 ATA (这需要付租金)
    // 简单的做法是：让用户自己先买一点点，或者这里帮他付 (成本较高)
    // 这里我们直接构建转账指令
    
    // 将金额转换为最小单位 (Lamports)
    const amountInSmallestUnit = BigInt(Math.floor(amountToClaim * Math.pow(10, DECIMALS)));

    transaction.add(
      createTransferInstruction(
        sourceTokenAccount,
        destTokenAccount,
        payer.publicKey,
        amountInSmallestUnit
      )
    );

    // 5. 发送交易并等待确认
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log(`✅ 转账成功! Signature: ${signature}`);

    // 6. 扣除数据库余额 (事务处理)
    // 将 pending_reward 归零
    const { error: updateError } = await supabase
      .from('users')
      .update({ pending_reward: 0 })
      .eq('wallet', wallet);

    if (updateError) {
      console.error("❌ 严重错误: 钱转了但数据库扣款失败！请人工核对。", wallet, amountToClaim);
      // 在这里可以写一个日志表记录这次异常
    } else {
        // (可选) 记录一条 'claim' 类型的 transaction 记录到 transactions 表
        await supabase.from('transactions').insert({
            signature: signature, // 提现的哈希
            buyer: wallet,        // 提现人
            token_amount: -amountToClaim, // 负数表示提现
            reward_amount: 0,
            referrer: 'SYSTEM_CLAIM'
        });
    }

    return NextResponse.json({ success: true, signature });

  } catch (err: any) {
    console.error('Claim Error:', err);
    
    // 常见错误处理
    let errorMsg = '提现失败，请稍后重试';
    if (err.message.includes("TokenAccountNotFoundError")) {
        errorMsg = "您的钱包尚未激活 MGT 代币账户，请先去买入任意数量的 MGT 激活一下。";
    } else if (err.message.includes("insufficient funds")) {
        errorMsg = "项目方国库余额不足，请联系管理员补货！";
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}