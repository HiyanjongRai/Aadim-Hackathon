import java.io.*;
import java.net.*;
 public class URLReadOperation {
    public static void main (String[] args){
        try
        {
            URL url =new URL("https://www.google.com");
                   
            BufferedReader br = new BufferedReader(new InputStreamReader(url.openStream()));
            
            String line ;
            while((line = br.readLine())!=null){
                    System.out.println(line);
            }

            br.close();
        }

        catch(Exception e){

            e.printStackTrace();

        }
    }
 }