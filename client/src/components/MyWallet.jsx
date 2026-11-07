import {Wallet,Copy,Check} from 'lucide-react';
import {useState} from 'react';
import {apiRequest,setToken} from '../api/client';
import PasswordWalletLink from './PasswordWalletLink';
export default function MyWallet({user,onSession,onGoogleVerify}){
 const [copied,setCopied]=useState(false);
 const [network,setNetwork]=useState('Chưa kiểm tra'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function inspect(){setError('');try{if(!window.ethereum)throw Error('Chưa có MetaMask');const id=await window.ethereum.request({method:'eth_chainId'});setNetwork('Mã mạng '+parseInt(id,16));}catch(e){setError(e.message);}}
 async function unlink(){setBusy(true);setError('');try{if(!window.ethereum)throw Error('Cần ví hiện tại để ký xác thực lại');const {BrowserProvider}=await import('ethers'),p=new BrowserProvider(window.ethereum);await p.send('eth_requestAccounts',[]);const signer=await p.getSigner();if((await signer.getAddress()).toLowerCase()!==user.walletAddress)throw Error('Chọn đúng ví đã liên kết');const c=await apiRequest('/auth/wallet/unlink-challenge',{method:'POST',body:{}}),r=await apiRequest('/auth/wallet/unlink',{method:'POST',body:{challengeId:c.challengeId,signature:await signer.signMessage(c.message)}});setToken(r.token);await onSession(r);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="security-card">
  <div className="security-card-heading"><span className="security-card-icon"><Wallet size={22}/></span><h3>Ví Web3</h3></div>
  <p className={'security-status '+(user.walletAddress?'is-linked':'')}>{user.walletAddress?'Đã liên kết ví':'Chưa liên kết ví'}</p>
  {user.walletAddress&&<div className="security-wallet-address"><span title={user.walletAddress}>{user.walletAddress.slice(0,6)}…{user.walletAddress.slice(-4)}</span><button type="button" className="icon-button" aria-label="Sao chép địa chỉ ví" onClick={async()=>{try{await navigator.clipboard.writeText(user.walletAddress);setCopied(true);setError('');}catch{setError('Không thể sao chép. Mở chi tiết ví để sao chép địa chỉ.');}}}>{copied?<Check size={18}/>:<Copy size={18}/>}</button>{copied&&<span role="status">Đã sao chép</span>}</div>}
  <details><summary>Thông tin xác thực ví</summary><p>Ký thông điệp xác thực, không gửi giao dịch và không mất phí gas.</p>{user.walletAddress&&<><p>{user.walletVerified?'Đã xác minh bằng chữ ký':'Chưa có bằng chứng xác minh ví'} · {network}</p><p style={{overflowWrap:'anywhere'}}>{user.walletAddress}</p><button type="button" className="btn btn-secondary" onClick={inspect}>Kiểm tra mạng ví</button>{(user.passwordEnabled||user.googleLinked)&&<button type="button" className="btn btn-secondary" disabled={busy} onClick={unlink}>Hủy liên kết (ký xác thực lại)</button>}</>}</details>
  <div className="security-card-actions">{!user.walletAddress&&user.passwordEnabled&&['student','company'].includes(user.role)&&<PasswordWalletLink onSession={onSession}/>}{!user.walletAddress&&!user.passwordEnabled&&user.googleLinked&&<button type="button" className="btn btn-primary" onClick={onGoogleVerify}>Liên kết ví MetaMask</button>}</div>
  {!user.walletAddress&&!user.passwordEnabled&&!user.googleLinked&&<p>Cần xác minh phương thức đăng nhập hiện có hoặc liên hệ quản trị viên trước khi liên kết ví.</p>}
  {error&&<p role="alert" className="inline-alert is-error">{error}</p>}
 </section>;
}
