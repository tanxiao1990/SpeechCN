/*
Copyright (C): 2010-2019, Shenzhen Yahboom Tech
modified from wujianzhang
load dependency
"Speech": "file:../pxt-Speech"
*/

//% color="#3CB371" weight=20 icon="\uf0a1"
namespace Speech {
    
    const DATA_HEAD = 0xFD                  //帧头
    
    let I2C_ADDR = 0x30 

    export enum I2C_ADDR_Select{
        //% blockId="NEW_ADDR" block="NEW_ADDR"
        NEW_ADDR = 0x30,
        //% blockId="OLD_ADDR" block="OLD_ADDR"  
        OLD_ADDR = 0x50
    }


    export enum EncodingFormat_Type{
        //% blockId="GB2312" block="GB2312"
        GB2312 = 0x00,
        //% blockId="GBK" block="GBK"  
        GBK = 0x01,
        //% blockId="BIG5" block="BIG5"        
        BIG5 = 0x02,
        //% blockId="UNICODE" block="UNICODE"        
        UNICODE = 0x03
    }


    //% blockId=Set_IICAddress block="Set_IICAddress|i2c_address %i2c_address"
    //% weight=99
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=12  
    export function Set_IICAddress(i2c_address: I2C_ADDR_Select): void {
        I2C_ADDR = i2c_address;
    }



    function IIC_Writes(date: number[], size: number): void {

        for(let i =0;i<size;i++)
        {
            pins.i2cWriteNumber(I2C_ADDR, date[i], NumberFormat.UInt8LE, false);
            basic.pause(10);
        }
    }




    // 将单个字符转换为 GB2312 编码（支持常用汉字）
    function charToGB2312(ch: string): number[] {
        // 简易 GB2312 对照表（可按需扩展）
        const table: { [key: string]: number[] } = {
            "温": [0xCE, 0xC2],
            "度": [0xB6, 0xC8],
            "是": [0xCA, 0xC7],
            "你": [0xC4, 0xE3],
            "好": [0xBA, 0xC3],
            "湘": [0xCF, 0xE6],
            // 你要说的字可以继续往下加……
        }

        if (table[ch]) return table[ch];

        // 英文或数字，直接单字节
        let code = ch.charCodeAt(0);
        return [code];
    }

    //% blockId=Speech_Text_Cn block="Speech_Text_Cn|speech_text %speech_text"
    //% weight=99
    //% blockGap=10
    export function Speech_Text_Cn(speech_text: string): void {
        let bytes: number[] = [];

        // 把整个字符串转换成编码后的字节流
        for (let ch of speech_text) {
            let arr = charToGB2312(ch);
            for (let b of arr) bytes.push(b);
        }
    
        let num = bytes.length + 2;
        let length_HH = num >> 8;
        let length_LL = num & 0xff;
        let commond = 0x01;
    
        let head = [DATA_HEAD, length_HH, length_LL, commond, 0x00];
        IIC_Writes(head, 5);
    
        // 发送内容
        for (let b of bytes) {
            pins.i2cWriteNumber(I2C_ADDR, b, NumberFormat.UInt8LE, false);
        }
    }


    //% blockId=Speech_Text block="Speech_Text|speech_text %speech_text"
    //% weight=99
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=12  
    export function Speech_Text(speech_text: string): void {
        let num = speech_text.length + 2;
        let total_num = speech_text.length;
        let length_HH= num >> 8;
        let length_LL = num & 0xff;
        let commond = 0x01;

        let buf:number[] = [DATA_HEAD,length_HH,length_LL,commond,0x00]; 
        
        IIC_Writes(buf,5);

        for(let ch of speech_text)
        {   
            pins.i2cWriteNumber(I2C_ADDR,ch.charCodeAt(0), NumberFormat.UInt8LE, false);
        }
        
        /*for(let i = 0;i < total_num;i++)
        {
            pins.i2cWriteNumber(I2C_ADDR,speech_text.charCodeAt(i), NumberFormat.UInt8LE, false);  
        }*/
    }



    export enum ChipStatus_Type {

        //% blockId="ChipStatus_InitSuccessful" block="ChipStatus_InitSuccessful"
        ChipStatus_InitSuccessful = 0x4A,
        //% blockId="ChipStatus_CorrectCommand" block="ChipStatus_CorrectCommand"
        ChipStatus_CorrectCommand = 0x41,
        //% blockId="ChipStatus_ErrorCommand" block="ChipStatus_ErrorCommand"
        ChipStatus_ErrorCommand = 0x45,
        //% blockId="ChipStatus_Busy" block="ChipStatus_Busy"
        ChipStatus_Busy = 0x4E,
        //% blockId="ChipStatus_Idle" block="ChipStatus_Idle"
        ChipStatus_Idle = 0x4F
    }

    //% blockId=GetChipStatus block="GetChipStatus"
    //% weight=99
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=12  
    export function GetChipStatus(): number {
        let AskState:number[] = [DATA_HEAD,0x00,0x01,0x21]; 
        
        IIC_Writes(AskState,4);

        basic.pause(100);

        let result = pins.i2cReadNumber(I2C_ADDR,NumberFormat.UInt8LE, false);
        return result;
        
    }


    //% blockId=Wait_XFS_Status block="Wait_XFS_Status|status %status"
    //% weight=99
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=12  
    export function Wait_XFS_Status(status:ChipStatus_Type): void {
        while(GetChipStatus() !=  status)
        {
            basic.pause(20);
        }
        
    }



    export enum Style_Type{
        //% blockId="Style_Single" block="Style_Single"
        Style_Single = 0,
        //% blockId="Style_Continue" block="Style_Continue"
        Style_Continue = 1
    }

    function SetBase(str:string): void { 
        let num = str.length + 2;
        let total_num = str.length;
        let length_HH= num >> 8;
        let length_LL = num & 0xff;
        let commond = 0x01;

        let buf:number[] = [DATA_HEAD,length_HH,length_LL,commond,0]; 
        
        IIC_Writes(buf,5);

        for(let i =0;i<total_num;i++)
        {
            pins.i2cWriteNumber(I2C_ADDR,str.charCodeAt(i), NumberFormat.UInt8LE, false);    
        }

    }

    //% blockId=SetStyle block="SetStyle|style_type %style_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetStyle(style_type:Style_Type): void { 
        
        if(style_type == 1)
        {
            SetBase("[f1]");
        }
        else
        {
            SetBase("[f0]");
        }
        
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }

    export enum Language_Type {

        //% blockId="Language_Auto" block="Language_Auto"
        Language_Auto = 0,
        //% blockId="Language_Chinese" block="Language_Chinese"
        Language_Chinese,
        //% blockId="Language_English" block="Language_English"
        Language_English
    }

    //% blockId=SetLanguage block="SetLanguage|language_type %language_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetLanguage(language_type:Language_Type): void { 
        
        if(language_type == 0)
        {
            SetBase("[g0]");
        }
        else if(language_type == 1)
        {
            SetBase("[g1]");
        }
        else if(language_type == 2)
        {
            SetBase("[g2]");
        }
        
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }


    export enum Articulation_Type {

        //% blockId="Articulation_Auto" block="Articulation_Auto"
        Articulation_Auto = 0,
        //% blockId="Articulation_Letter" block="Articulation_Letter"
        Articulation_Letter,
        //% blockId="Articulation_Word" block="Articulation_Word"
        Articulation_Word
    }

    //% blockId=SetArticulation block="SetArticulation|articulation_type %articulation_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetArticulation(articulation_type:Articulation_Type): void { 
        
        if(articulation_type == 0)
        {
            SetBase("[h0]");
        }
        else if(articulation_type == 1)
        {
            SetBase("[h1]");
        }
        else if(articulation_type == 2)
        {
            SetBase("[h2]");
        }
        
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }


    export enum Spell_Type {

        //% blockId="Spell_Disable" block="Spell_Disable"
        Spell_Disable = 0,
        //% blockId="Spell_Enable" block="Spell_Enable"
        Spell_Enable
    }

    //% blockId=SetSpell block="SetSpell|spell_type %spell_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetSpell(spell_type:Spell_Type): void { 
        
        if(spell_type == 0)
        {
            SetBase("[i0]");
        }
        else if(spell_type == 1)
        {
            SetBase("[i1]");
        }

        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
        
    }   


    export enum Reader_Type {

        //% blockId="Reader_XiaoYan" block="Reader_XiaoYan"
        Reader_XiaoYan = 3,
        //% blockId="Reader_XuJiu" block="Reader_XuJiu"
        Reader_XuJiu = 51,
        //% blockId="Reader_XuDuo" block="Reader_XuDuo"
        Reader_XuDuo = 52,
        //% blockId="Reader_XiaoPing" block="Reader_XiaoPing"
        Reader_XiaoPing = 53,
        //% blockId="Reader_DonaldDuck" block="Reader_DonaldDuck"
        Reader_DonaldDuck = 54,
        //% blockId="Reader_XuXiaoBao" block="Reader_XuXiaoBao"
        Reader_XuXiaoBao = 55
    }

    //% blockId=SetReader block="SetReader|reader_type %reader_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetReader(reader_type:Reader_Type): void { 
        
        if(reader_type == 3)
        {
            SetBase("[m3]");
        }
        else if(reader_type == 51)
        {
            SetBase("[m51]");
        }
        else if(reader_type == 52)
        {
            SetBase("[m52]");
        }
        else if(reader_type == 53)
        {
            SetBase("[m53]");
        }
        else if(reader_type == 54)
        {
            SetBase("[m54]");
        }
        else if(reader_type == 55)
        {
            SetBase("[m55]");
        }

        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
        
    }

    export enum NumberHandle_Type {

        //% blockId="NumberHandle_Auto" block="NumberHandle_Auto"
        NumberHandle_Auto = 0,
        //% blockId="NumberHandle_Number" block="NumberHandle_Number"
        NumberHandle_Number,
        //% blockId="NumberHandle_Value" block="NumberHandle_Value"
        NumberHandle_Value
    }

    //% blockId=SetNumberHandle block="SetNumberHandle|numberhandle_type %numberhandle_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetNumberHandle(numberhandle_type:NumberHandle_Type): void { 
        
        if(numberhandle_type == 0)
        {
            SetBase("[n0]");
        }
        else if(numberhandle_type == 1)
        {
            SetBase("[n1]");
        }
        else if(numberhandle_type == 2)
        {
            SetBase("[n2]");
        }
        
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }

    export enum ZeroPronunciation_Type {

        //% blockId="ZeroPronunciation_Zero" block="ZeroPronunciation_Zero"
        ZeroPronunciation_Zero = 0,
        //% blockId="ZeroPronunciation_O" block="ZeroPronunciation_O"
        ZeroPronunciation_O
    }

    //% blockId=SetZeroPronunciation block="SetZeroPronunciation|zeropronunciation_type %zeropronunciation_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetZeroPronunciation(zeropronunciation_type:ZeroPronunciation_Type): void { 
        
        if(zeropronunciation_type == 0)
        {
            SetBase("[o0]");
        }
        else if(zeropronunciation_type == 1)
        {
            SetBase("[o1]");
        }
        
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }

    export enum NamePronunciation_Type {

        //% blockId="NamePronunciation_Auto" block="NamePronunciation_Auto"
        NamePronunciation_Auto = 0,
        //% blockId="NamePronunciation_Constraint" block="NamePronunciation_Constraint"
        NamePronunciation_Constraint
    }

    //% blockId=SetNamePronunciation block="SetNamePronunciation|namepronunciation_type %namepronunciation_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetNamePronunciation(namepronunciation_type:NamePronunciation_Type): void { 
        
        if(namepronunciation_type == 0)
        {
            SetBase("[r0]");
        }
        else if(namepronunciation_type == 1)
        {
            SetBase("[r1]");
        }

        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }    
    }

    //% blockId=SetSpeed block="SetSpeed|speed %speed"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetSpeed(speed:number): void { 
        
            SetBase("[s"+speed+"]");
            while(GetChipStatus() !=  0x4F)
            {
                basic.pause(50);
            }
    }

    //% blockId=SetIntonation block="SetIntonation|intonation %intonation"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetIntonation(intonation:number): void { 
        
        SetBase("[t"+intonation+"]");
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }

    //% blockId=SetVolume block="SetVolume|volume %volume"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetVolume(volume:number): void { 
        
        SetBase("[v"+volume+"]");
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }
    }

    export enum OnePronunciation_Type {

        //% blockId="OnePronunciation_Yao" block="OnePronunciation_Yao"
        OnePronunciation_Yao = 0,
        //% blockId="OnePronunciation_Yi" block="OnePronunciation_Yi"
        OnePronunciation_Yi
    }

    //% blockId=SetOnePronunciation block="SetOnePronunciation|onepronunciation_type %onepronunciation_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetOnePronunciation(onepronunciation_type:OnePronunciation_Type): void { 
        
        if(onepronunciation_type == 0)
        {
            SetBase("[y0]");
        }
        else if(onepronunciation_type == 1)
        {
            SetBase("[y1]");
        }

        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }    
    }

    
    export enum Rhythm_Type {

        //% blockId="Rhythm_Diasble" block="Rhythm_Diasble"
        Rhythm_Diasble = 0,
        //% blockId="Rhythm_Enable" block="Rhythm_Enable"
        Rhythm_Enable
    }

    //% blockId=SetRhythm block="SetRhythm|rhythm_type %rhythm_type"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetRhythm(rhythm_type:Rhythm_Type): void { 
        
        if(rhythm_type == 0)
        {
            SetBase("[z0]");
        }
        else if(rhythm_type == 1)
        {
            SetBase("[z1]");
        }
        while(GetChipStatus() !=  0x4F)
        {
            basic.pause(50);
        }    
    }

    //% blockId=SetRestoreDefault block="SetRestoreDefault"
    //% weight=92
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function SetRestoreDefault(): void { 
        
            SetBase("[d]");
            while(GetChipStatus() !=  0x4F)
            {
                basic.pause(50);
            }
   
    }


    // 第一个参数的枚举：xiang1ei1 / xiang1bi4 / xiang1xi1 / xiang1gou1
    export enum Xiang_Type {
        //% blockId="xiang1ei1" block="湘A"
        xiang1ei1 = 0,
        //% blockId="xiang1bi4" block="湘B"
        xiang1bi4 = 1,
        //% blockId="xiang1xi1" block="湘C"
        xiang1xi1 = 2,
        //% blockId="xiang1gou1" block="湘J"
        xiang1gou1 = 3
    }

    // 第二个参数的枚举：qq683 / 510ph / k228g / t82n9
    // 注意：枚举成员不能以数字开头，以下以前缀形式命名，但 block 显示为原始字符串
    export enum QQ_Type {
        //% blockId="qq683" block="qq683"
        qq683 = 0,
        //% blockId="510ph" block="510ph"
        _510ph = 1,
        //% blockId="k228g" block="k228g"
        k228g = 2,
        //% blockId="t82n9" block="t82n9"
        t82n9 = 3
    }

    // 将第一个枚举映射为字符串
    function mapFirstText(first: Xiang_Type): string {
        switch (first) {
            case Xiang_Type.xiang1ei1: return "xiang1ei1";
            case Xiang_Type.xiang1bi4: return "xiang1bi4";
            case Xiang_Type.xiang1xi1: return "xiang1xi1";
            case Xiang_Type.xiang1gou1: return "xiang1gou1";
        }
        return "xiang1ei1";
    }

    // 将第二个枚举映射为字符串
    function mapSecondText(second: QQ_Type): string {
        switch (second) {
            case QQ_Type.qq683: return "qq683";
            case QQ_Type._510ph: return "510ph";
            case QQ_Type.k228g: return "k228g";
            case QQ_Type.t82n9: return "t82n9";
        }
        return "qq683";
    }

    //% blockId=Speak_Che_Pai block="Speak_Che_Pai|first %first second %second"
    //% weight=90
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Speak_Che_Pai(first: Xiang_Type, second: QQ_Type): void {
        // 按用户示例使用命名空间前缀调用
        Speech.SetSpeed(4);
        Speech.SetSpell(Speech.Spell_Type.Spell_Enable);

        // 说第一个枚举对应的字符串
        Speech.Speech_Text(mapFirstText(first));

        // 等待芯片空闲
        Speech.Wait_XFS_Status(Speech.ChipStatus_Type.ChipStatus_Idle);

        // 关闭拼读，按字母和数字读法
        Speech.SetSpell(Speech.Spell_Type.Spell_Disable);
        Speech.SetArticulation(Speech.Articulation_Type.Articulation_Letter);
        Speech.SetNumberHandle(Speech.NumberHandle_Type.NumberHandle_Number);

        // 说第二个枚举对应的字符串
        Speech.Speech_Text(mapSecondText(second));
    }


    //% blockId=Speak_Che_And_Pai block="Speak_Che_And_Pai|first %first second %second"
    //% weight=90
    //% blockGap=10
    //% color="#3CB371"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Speak_Che_And_Pai(first: string, second: string): void {
        // 按用户示例使用命名空间前缀调用
        Speech.SetSpeed(4);
        Speech.SetSpell(Speech.Spell_Type.Spell_Enable);

        Speech.Speech_Text(first);

        // 等待芯片空闲
        Speech.Wait_XFS_Status(Speech.ChipStatus_Type.ChipStatus_Idle);

        // 关闭拼读，按字母和数字读法
        Speech.SetSpell(Speech.Spell_Type.Spell_Disable);
        Speech.SetArticulation(Speech.Articulation_Type.Articulation_Letter);
        Speech.SetNumberHandle(Speech.NumberHandle_Type.NumberHandle_Number);

        Speech.Speech_Text(second);
    }

 
}
